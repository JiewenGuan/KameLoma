import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

const kuroshiro = new Kuroshiro();
let isInitialized = false;

export async function initializeKuroshiro() {
  if (isInitialized) return;

  try {
    console.log('Initializing Kuroshiro...');
    await kuroshiro.init(new KuromojiAnalyzer({
      dictPath: chrome.runtime.getURL('assets/dict/')
    }));
    isInitialized = true;
    console.log('Kuroshiro initialized successfully!');
  } catch (err) {
    console.error('Kuroshiro initialization failed:', err);
    throw err;
  }
}

export async function convertText(text) {
  if (!isInitialized) {
    console.log('Initializing Kuroshiro before conversion...');
    await initializeKuroshiro();
  }

  try {
    const result = await kuroshiro.convert(text, {
      to: 'romaji',
      mode: 'furigana',
      romajiSystem: 'passport'
    });

    return result;
  } catch (err) {
    console.error('Conversion failed:', err);
    return text;
  }
}

export async function convertToRomaji(text) {
  if (!isInitialized) {
    await initializeKuroshiro();
  }
  try {
    return await kuroshiro.convert(text, {
      to: 'romaji',
      mode: 'normal', // Returns plain string
      romajiSystem: 'passport'
    });
  } catch (err) {
    console.error('Romaji conversion failed:', err);
    return text;
  }
}

export function logMessage(message) {
  console.log(`[KameLoma] ${message}`);
}