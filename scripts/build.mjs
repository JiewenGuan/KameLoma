import { build } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const getBaseConfig = () => ({
    root,
    configFile: false,
    logLevel: 'info',
    resolve: {
        alias: {
            path: 'path-browserify',
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        minify: false,
        sourcemap: false,
    }
});

async function runBuild() {
    try {
        // 1. Build Background + Static Assets
        console.log('Building background and assets...');
        await build({
            ...getBaseConfig(),
            build: {
                ...getBaseConfig().build,
                emptyOutDir: true,
                rollupOptions: {
                    input: { background: path.resolve(root, 'src/background/background.js') },
                    output: {
                        format: 'iife',
                        entryFileNames: '[name].js',
                        inlineDynamicImports: true,
                    }
                }
            },
            plugins: [
                viteStaticCopy({
                    targets: [
                        { src: 'manifest.json', dest: '.' },
                        { src: 'icons', dest: '.' },
                        { src: 'src/_locales', dest: '.' },
                        { src: 'node_modules/kuromoji/dict', dest: 'assets' },
                        {
                            src: 'src/popup/popup.html',
                            dest: '.',
                            transform: (content) => content.toString().replace('<script type="module" src="popup.js"></script>', '<script src="popup.js"></script>')
                        },
                        { src: 'src/popup/popup.css', dest: '.' }
                    ]
                })
            ]
        });

        // 2. Build Content
        console.log('Building content...');
        await build({
            ...getBaseConfig(),
            build: {
                ...getBaseConfig().build,
                rollupOptions: {
                    input: { content: path.resolve(root, 'src/content/content.js') },
                    output: {
                        format: 'iife',
                        entryFileNames: '[name].js',
                        inlineDynamicImports: true,
                    }
                }
            }
        });

        // 3. Build Popup
        console.log('Building popup...');
        await build({
            ...getBaseConfig(),
            build: {
                ...getBaseConfig().build,
                rollupOptions: {
                    input: { popup: path.resolve(root, 'src/popup/popup.js') },
                    output: {
                        format: 'iife',
                        entryFileNames: '[name].js',
                        inlineDynamicImports: true,
                    }
                }
            }
        });

        console.log('Build completed successfully!');
    } catch (e) {
        console.error('Build failed:', e);
        process.exit(1);
    }
}

runBuild();
