import React, { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

const RichTextEditor = ({ value, onChange }) => {
    const [editorContent, setEditorContent] = useState(value || "");
    return (
        <Editor
            apiKey="3ghe6x6lazb4cgbytjrsyr4nvu3x8xi8nzvjt6d087ywptfs"            
            value={editorContent}
            onEditorChange={(content) => {
                setEditorContent(content);
                onChange(content);
            }}
            init={{
                selector: 'div',
                height: 500,
                menubar: false,
                toolbar_location: 'auto',
                toolbar_sticky: true,
                toolbar_sticky_offset: 65,
                plugins: [
                    // Core editing features
                    'anchor',
                    'autolink',
                    'charmap',
                    'codesample',
                    'emoticons',
                    'image', 'link',
                    'lists', 'media', 'searchreplace',
                    'table', 'visualblocks', 'wordcount',
                    'autoresize', 'preview'
                    // Your account includes a free trial of TinyMCE premium features
                    // Try the most popular premium features until Feb 12, 2025:
                    // 'checklist', 'mediaembed', 'casechange', 'export', 'formatpainter', 'pageembed', 
                    // 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 
                    // 'advcode', 'editimage', 'advtemplate', 'mentions', 'tinycomments', 'tableofcontents', 
                    // 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown',
                    // 'importword', 'exportword', 'exportpdf'
                ],
                toolbar: 'preview | undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align alignleft aligncenter alignright alignjustify | outdent indent | lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                automatic_uploads: true,
                content_style: "body { font-family:Arial,sans-serif; font-size:14px }",
            }}
        />
    );
};

export default RichTextEditor;
