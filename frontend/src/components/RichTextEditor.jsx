import { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';

import 'tinymce/tinymce';
import 'tinymce/models/dom/model';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';

import 'tinymce/skins/ui/oxide/skin.min.css';
import 'tinymce/skins/ui/oxide/content.min.css';
import 'tinymce/skins/content/default/content.min.css';

import 'tinymce/plugins/anchor';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/codesample';
import 'tinymce/plugins/emoticons';
import 'tinymce/plugins/emoticons/js/emojis';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/table';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/wordcount';

const RichTextEditor = ({ value, onChange }) => {
    const [editorContent, setEditorContent] = useState(value || '');

    useEffect(() => {
        setEditorContent(value || '');
    }, [value]);

    return (
        <Editor
            licenseKey="gpl"
            value={editorContent}
            onEditorChange={(content) => {
                setEditorContent(content);
                onChange(content);
            }}
            init={{
                height: 500,
                menubar: false,
                promotion: false,
                branding: false,
                plugins: [
                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                    'image', 'link', 'lists', 'media', 'searchreplace',
                    'table', 'visualblocks', 'wordcount', 'autoresize', 'preview',
                ],
                toolbar:
                    'preview | undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | link image media table | alignleft aligncenter alignright | numlist bullist | removeformat',
                automatic_uploads: true,
                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px }',
            }}
        />
    );
};

export default RichTextEditor;
