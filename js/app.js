// -------------------- Reconocimiento de voz: compatibilidad --------------------

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

// -------------------- Elementos del DOM --------------------

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const whatsappBtn =
  document.getElementById("whatsappBtn");
const transcriptArea = document.getElementById("transcript");
const statusBox = document.getElementById("status");
const languageSelect =
  document.getElementById("languageSelect");

// -------------------- Configuracion --------------------

const DUPLICATE_WINDOW_MS = 8000;
const RESTART_DELAY_MS = 350;

// -------------------- Variables globales --------------------

let recognition;
let keepListening = false;
let isRecognitionActive = false;
let restartTimer;
let finalText =
  localStorage.getItem("audioTexto_transcripcion") || "";
let recentFinals = [];

transcriptArea.value = finalText;

// -------------------- Funciones utilitarias --------------------

function setStatus(message) {
  statusBox.textContent = message;
}

function saveText() {
  localStorage.setItem(
    "audioTexto_transcripcion",
    transcriptArea.value
  );
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getOnlyNewWords(previousText, newText) {
  const previousWords = normalizeText(previousText).split(" ");
  const newWords = newText.trim().split(" ");
  const normalizedNewWords = normalizeText(newText).split(" ");

  let maxOverlap = 0;

  for (let i = 1; i <= normalizedNewWords.length; i++) {
    const endPrevious = previousWords.slice(-i).join(" ");
    const startNew = normalizedNewWords.slice(0, i).join(" ");

    if (endPrevious === startNew) {
      maxOverlap = i;
    }
  }

  return newWords.slice(maxOverlap).join(" ");
}

function updateButtons() {
  startBtn.disabled = keepListening;
  stopBtn.disabled = !keepListening;
}

function wasRecentlyAdded(text) {
  const now = Date.now();
  const normalizedText = normalizeText(text);

  recentFinals = recentFinals.filter(
    item => now - item.time < DUPLICATE_WINDOW_MS
  );

  return recentFinals.some(
    item => item.text === normalizedText
  );
}

function rememberFinal(text) {
  recentFinals.push({
    text: normalizeText(text),
    time: Date.now()
  });
}

function appendFinalText(text) {
  const cleanText = text.trim();

  if (!cleanText || wasRecentlyAdded(cleanText)) {
    return;
  }

  const onlyNewText = getOnlyNewWords(finalText, cleanText);

  if (!onlyNewText.trim()) {
    return;
  }

  finalText += onlyNewText.trim() + " ";
  rememberFinal(cleanText);
}

// -------------------- Reconocimiento de voz --------------------

function scheduleRestart() {
  clearTimeout(restartTimer);

  restartTimer = setTimeout(() => {
    if (!recognition || !keepListening || isRecognitionActive) {
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      scheduleRestart();
    }
  }, RESTART_DELAY_MS);
}

function startRecognition() {
  if (!recognition || keepListening) return;

  keepListening = true;
  updateButtons();
  setStatus("Escuchando...");

  try {
    recognition.start();
  } catch (error) {
    scheduleRestart();
  }
}

function stopRecognition() {
  if (!recognition) return;

  keepListening = false;
  clearTimeout(restartTimer);
  updateButtons();

  if (isRecognitionActive) {
    recognition.stop();
  } else {
    setStatus("Transcripcion detenida.");
  }
}

if (!SpeechRecognition) {

  startBtn.disabled = true;
  stopBtn.disabled = true;

  setStatus(
    "Tu navegador no soporta reconocimiento de voz. Proba con Chrome."
  );

} else {

  recognition = new SpeechRecognition();

  recognition.lang =
  languageSelect.value;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isRecognitionActive = true;
    updateButtons();
    setStatus("Escuchando...");
  };

  recognition.onresult = (event) => {
    let interimText = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      const text =
        event.results[i][0].transcript.trim();

      if (event.results[i].isFinal) {
        appendFinalText(text);
      } else {
        interimText += text + " ";
      }
    }

    transcriptArea.value =
      finalText + interimText;

    saveText();
  };

  recognition.onerror = (event) => {
    isRecognitionActive = false;

    if (
      event.error === "not-allowed" ||
      event.error === "service-not-allowed"
    ) {
      keepListening = false;
      updateButtons();
      setStatus("Permiso de microfono denegado.");
      return;
    }

    if (keepListening) {
      setStatus("Pausa detectada. Retomando...");
      scheduleRestart();
      return;
    }

    setStatus("Error: " + event.error);
  };

  recognition.onend = () => {
    isRecognitionActive = false;
    updateButtons();

    if (keepListening) {
      setStatus("Pausa detectada. Retomando...");
      scheduleRestart();
      return;
    }

    setStatus("Transcripcion detenida.");
  };

}

// -------------------- Eventos --------------------

startBtn.addEventListener(
  "click",
  startRecognition
);

stopBtn.addEventListener(
  "click",
  stopRecognition
);

languageSelect.addEventListener(
  "change",
  () => {

    if (recognition) {

      recognition.lang =
        languageSelect.value;

      setStatus(
        "Idioma cambiado."
      );

    }

  }
);

transcriptArea.addEventListener(
  "input",
  () => {
    finalText = transcriptArea.value;
    saveText();
  }
);

copyBtn.addEventListener(
  "click",
  async () => {
    const text =
      transcriptArea.value.trim();

    if (!text) {
      setStatus(
        "No hay texto para copiar."
      );

      return;
    }

    await navigator.clipboard.writeText(
      text
    );

    setStatus("Texto copiado.");
  }
);

downloadBtn.addEventListener(
  "click",
  () => {
    const text =
      transcriptArea.value.trim();

    if (!text) {
      setStatus(
        "No hay texto para descargar."
      );

      return;
    }

    const file = new Blob(
      [text],
      {
        type:
          "text/plain;charset=utf-8"
      }
    );

    const url =
      URL.createObjectURL(file);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "transcripcion.txt";

    link.click();

    URL.revokeObjectURL(url);

    setStatus(
      "Archivo descargado."
    );
  }
);

whatsappBtn.addEventListener(
  "click",
  () => {
    const text =
      transcriptArea.value.trim();

    if (!text) {
      setStatus(
        "No hay texto para compartir."
      );

      return;
    }

    const whatsappUrl =
      `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(
      whatsappUrl,
      "_blank"
    );
  }
);

clearBtn.addEventListener(
  "click",
  () => {
    transcriptArea.value = "";
    finalText = "";
    recentFinals = [];

    localStorage.removeItem(
      "audioTexto_transcripcion"
    );

    setStatus(
      "Texto limpiado."
    );
  }
);

// -------------------- Service worker --------------------

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
