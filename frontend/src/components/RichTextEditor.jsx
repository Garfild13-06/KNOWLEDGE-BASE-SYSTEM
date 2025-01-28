import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// Кастомный адаптер для загрузки изображений
class MyUploadAdapter {
    constructor(loader) {
        this.loader = loader;
    }

    async upload() {
        const data = new FormData();
        const file = await this.loader.file;
        data.append("upload", file);

        return fetch("http://127.0.0.1:8000/api/uploads/", {
            method: "POST",
            body: data
        })
            .then(response => response.json())
            .then(result => {
                if (result.url) {
                    return { default: result.url };
                } else {
                    return Promise.reject(result);
                }
            })
            .catch(error => {
                console.error("Ошибка загрузки:", error);
                return Promise.reject(error);
            });
    }
}

function CustomUploadPlugin(editor) {
    editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
        return new MyUploadAdapter(loader);
    };
}

const editorConfiguration = {
    licenseKey: "GPL",
    extraPlugins: [CustomUploadPlugin], // Добавляем кастомную загрузку изображений
    toolbar: [
        'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote',
        '|', 'insertTable', 'tableColumn', 'tableRow', 'mergeTableCells',
        '|', 'imageUpload', 'mediaEmbed',
        '|', 'undo', 'redo'
    ],
    image: {
        toolbar: [
            'imageStyle:inline',  // Вставка изображения в строку текста
            'imageStyle:wrapText',  // Обтекание текстом
            'imageStyle:breakText',  // Разрыв текста
            'imageTextAlternative',  // Альтернативный текст (доступность)
            'imageResize',  // Изменение размера изображения
            'imageStyle:side',  // Выравнивание сбоку
            'linkImage',  // Добавление ссылки на изображение
        ],
    },

};

const RichTextEditor = ({ value, onChange }) => {
    return (
        <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={value}
            onReady={(editor) => {
                console.log('Editor is ready to use!', editor);
                console.log('Доступные элементы в тулбаре:', Array.from(editor.ui.componentFactory.names()));
            }}

            onChange={(event, editor) => {
                const data = editor.getData();
                onChange(data);
            }}
        />
    );
};

export default RichTextEditor;
