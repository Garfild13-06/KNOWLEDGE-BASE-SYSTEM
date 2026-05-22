import json
import os

import requests

from .features import ai_enabled


def _openai_config():
    return {
        'api_key': os.getenv('OPENAI_API_KEY', '').strip(),
        'model': os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
        'base_url': os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1').rstrip('/'),
    }


def ai_available(organization):
    if not ai_enabled(organization):
        return False
    return bool(_openai_config()['api_key'])


def _chat_completion(system_prompt, user_prompt):
    cfg = _openai_config()
    response = requests.post(
        f"{cfg['base_url']}/chat/completions",
        headers={
            'Authorization': f"Bearer {cfg['api_key']}",
            'Content-Type': 'application/json',
        },
        json={
            'model': cfg['model'],
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_prompt},
            ],
            'temperature': 0.2,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']


def summarize_article(organization, title, content_plain):
    if not ai_available(organization):
        return {'error': 'AI отключён. Установите KB_ENABLE_AI=true и OPENAI_API_KEY.'}
    prompt = f"Статья: {title}\n\n{content_plain[:8000]}"
    text = _chat_completion(
        'Сделай краткое содержание на русском: 5-7 пунктов.',
        prompt,
    )
    return {'summary': text, 'generated': True}


def generate_draft_from_outline(organization, outline):
    if not ai_available(organization):
        return {'error': 'AI отключён. Установите KB_ENABLE_AI=true и OPENAI_API_KEY.'}
    html_content = _chat_completion(
        'Пиши на русском. Верни только HTML фрагмент (p, h2, ul, li), без markdown.',
        outline,
    )
    return {'content': html_content, 'generated': True}


def rag_answer(organization, question, articles_context):
    if not ai_available(organization):
        return {'error': 'AI отключён. Установите KB_ENABLE_AI=true и OPENAI_API_KEY.'}
    context = '\n\n---\n\n'.join(articles_context[:8])
    answer = _chat_completion(
        'Отвечай только на основе контекста. Если данных нет — скажи об этом. Ответ на русском.',
        f'Контекст:\n{context}\n\nВопрос: {question}',
    )
    return {'answer': answer, 'generated': True}


def quality_check(content_plain):
    issues = []
    if len(content_plain) < 80:
        issues.append('Слишком мало текста')
    if 'http://' in content_plain and 'https://' not in content_plain:
        issues.append('Есть небезопасные http-ссылки')
    return issues
