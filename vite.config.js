import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        minify: false, // Easier debugging
        rollupOptions: {
            input: {
                background: path.resolve(__dirname, 'src/background/background.js'),
                content: path.resolve(__dirname, 'src/content/content.js'),
                popup: path.resolve(__dirname, 'src/popup/popup.js'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name]-[hash].js',
                assetFileNames: '[name]-[hash].[ext]',
                format: 'iife',
                name: 'KameLoma',
                extend: true,
                inlineDynamicImports: false, // Allow code splitting if needed, but for IIFE usually we want bundling. 
                // Actually for multiple inputs with IIFE, Rollup might create shared chunks which IIFE doesn't support well without a loader.
                // But let's see. If we get errors, we might need to inline everything.
                // For extensions, it's safest to bundle everything into the entry points.
                // To force no shared chunks:
                manualChunks: () => 'vendor', // This might force a shared vendor chunk, which is bad for IIFE content scripts.
                // Better strategy: Let's try default. If it creates shared chunks, we might need to change strategy.
                // Actually, 'iife' format DOES NOT support code splitting for multiple entry points if they share code.
                // Rollup will error: "Invalid value "iife" for option "output.format" - UMD and IIFE output formats are not supported for code-splitting builds."
                // SO WE MUST DISABLE CODE SPLITTING.
            },
        },
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'manifest.json',
                    dest: '.',
                },
                {
                    src: 'icons',
                    dest: '.',
                },
                {
                    src: 'node_modules/kuromoji/dict',
                    dest: 'assets',
                },
                {
                    src: 'src/popup/popup.html',
                    dest: '.',
                    transform: (content) => {
                        return content.toString().replace(
                            '<script type="module" src="popup.js"></script>',
                            '<script src="popup.js"></script>'
                        );
                    }
                }
            ],
        }),
    ],
});
