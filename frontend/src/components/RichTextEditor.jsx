import React, { useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

const RichTextEditor = ({ value, onChange }) => {
    const [editorContent, setEditorContent] = useState(value || "");
    const apiKey = import.meta.env.VITE_TINYMCE_API_KEY || "no-api-key";

    useEffect(() => {
        setEditorContent(value || "");
    }, [value]);

    return (
        <Editor
            apiKey={apiKey}
            value={editorContent}
            onEditorChange={(content) => {
                setEditorContent(content);
                onChange(content);
            }}
            init={{
                height: 500,
                menubar: false,
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
