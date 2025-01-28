import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { addToolbarToImage } from '@ckeditor/ckeditor5-image/src/image/ui/utils';
import { createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import { Model } from '@ckeditor/ckeditor5-ui/src/model';

export default class CustomImageResize extends Plugin {
    init() {
        const editor = this.editor;
        const command = editor.commands.get('resizeImage');

        editor.ui.componentFactory.add('customImageResize', (locale) => {
            const dropdown = createDropdown(locale);

            const options = [
                { label: '50%', value: '50%' },
                { label: '75%', value: '75%' },
                { label: '100%', value: '100%' },
                { label: '150%', value: '150%' },
                { label: '200%', value: '200%' }
            ];

            const items = options.map(option => {
                const model = new Model({
                    label: option.label,
                    withText: true
                });

                model.set('execute', () => {
                    editor.execute('resizeImage', { width: option.value });
                });

                return model;
            });

            dropdown.buttonView.set({
                label: 'Resize Image',
                tooltip: true
            });

            dropdown.listView.items.add(items);
            addToolbarToImage(dropdown);

            return dropdown;
        });

        console.log('CustomImageResize plugin initialized!');
    }
}
