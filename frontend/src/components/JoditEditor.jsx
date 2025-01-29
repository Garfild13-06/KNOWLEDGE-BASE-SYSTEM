import React, { useRef } from "react";
import JoditEditor from "jodit-react";

const JoditTextEditor = ({ value, onChange }) => {
    const editor = useRef(null);

    const config = {
        uploader: {
            insertImageAsBase64URI: false,
            url: "http://127.0.0.1:8000/api/uploads/",
            format: "json",
            imagesExtensions: ["jpg", "png", "jpeg", "gif"],
            method: "POST",
            isSuccess: (resp) => resp.success === true,
            getMessage: (resp) => resp.message || "Ошибка загрузки",
            error: (e) => console.error("Ошибка загрузки:", e),
        },

        toolbarAdaptive: false,
        height: 500,
        buttons: "bold,italic,underline,strikethrough,|,ul,ol,|,outdent,indent,|,image,table,link,undo,redo",
    };

    return (
        <JoditEditor
            ref={editor}
            value={value}
            config={config}
            onBlur={(newContent) => onChange(newContent)}
            onChange={(content) => console.log("Контент изменён:", content)}
        />
    );
};

export default JoditTextEditor;
