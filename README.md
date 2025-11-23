# KameLoma - 日语汉字注音助手 (Japanese Kanji Romaji Annotator)

**KameLoma** is a powerful browser extension designed to help Japanese learners by automatically annotating Kanji with Romaji readings. It transforms any web page into a learning resource.

## ✨ Features

-   **🎯 Global Support**: Works on any website (Twitter, Pixiv, News sites, etc.).
-   **⚡ Auto-Run**: Enable automatic annotation for specific domains (e.g., always run on `pixiv.net`).
-   **🎨 Customizable**:
    -   Adjust **Font Size**.
    -   Change **Annotation Color** (Default: Red).
-   **🧠 Active Learning Modes**:
    -   **Mask Mode (遮罩模式)**: Blurs annotations by default. Hover over a specific word to reveal its reading. Perfect for "Active Recall" practice.
    -   **Click-to-Read (点击朗读)**: Click on any annotated word to hear it read aloud by a native Japanese voice engine.

## 🚀 Installation

### From Source (Developer Mode)

1.  Clone this repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Build the project:
    ```bash
    npm run build
    ```
4.  Open your browser (Chrome or Edge) and go to `chrome://extensions/` or `edge://extensions/`.
5.  Enable **Developer mode**.
6.  Click **Load unpacked**.
7.  Select the `dist` directory inside the project folder.

## 📖 Usage

1.  **Annotate**: Click the extension icon and press the **"添加注音" (Annotate)** button to process the current page.
2.  **Settings**:
    -   Use the sliders and color picker to adjust the look.
    -   Toggle **"在此网站自动运行"** to enable auto-annotation for the current site.
3.  **Learning**:
    -   Enable **Mask Mode** to hide readings until you hover.
    -   Enable **Click-to-Read** to listen to pronunciation.

## 🛠️ Tech Stack

-   **Vite**: Fast build tool.
-   **Kuroshiro**: Japanese language utility for Kanji-to-Romaji conversion.
-   **Kuromoji**: Morphological analyzer.

## 📄 License

MIT
