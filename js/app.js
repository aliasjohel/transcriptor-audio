const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
const transcriptArea = document.getElementById("transcript");
const statusBox = document.getElementById("status");

let recognition;
let isListening = false;
let finalText =
  localStorage.getItem("audioTexto_transcripcion") || "";

let processedFinalIndexes = new Set();

transcriptArea.value = finalText;

function setStatus(message) {
  statusBox.textContent = message;
}

function saveText() {
  localStorage.setItem(
    "audioTexto_transcripcion",
    transcriptArea.value
  );
}

function startRecognition() {

  if (!recognition || isListening) return;

  processedFinalIndexes = new Set();

  try {
    isListening = true;
    recognition.start();
  } catch (error) {
    console.log("Ya iniciado.");
  }

}

function stopRecognition() {

  if (!recognition) return;

  isListening = false;
  recognition.stop();

}

if (!SpeechRecognition) {

  startBtn.disabled = true;
  stopBtn.disabled = true;

  setStatus(
    "Tu navegador no soporta reconocimiento de voz."
  );

} else {

  recognition = new SpeechRecognition();

  recognition.lang = "es-AR";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {

    startBtn.disabled = true;
    stopBtn.disabled = false;

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

        if (!processedFinalIndexes.has(i)) {

          finalText += text + " ";
          processedFinalIndexes.add(i);

        }

      } else {

        interimText += text + " ";

      }

    }

    transcriptArea.value =
      finalText + interimText;

    saveText();

  };

  recognition.onerror = (event) => {

    setStatus(
      "Error: " + event.error
    );

  };

  recognition.onend = () => {

    startBtn.disabled = false;
    stopBtn.disabled = true;

    if (isListening) {

      setStatus(
        "Pausa detectada. Retomando..."
      );

      setTimeout(() => {

        try {

          processedFinalIndexes = new Set();
          recognition.start();

        } catch (error) {

          console.log(
            "No se pudo reiniciar."
          );

        }

      }, 500);

    } else {

      setStatus(
        "Transcripción detenida."
      );

    }

  };

}

startBtn.addEventListener(
  "click",
  startRecognition
);

stopBtn.addEventListener(
  "click",
  stopRecognition
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

clearBtn.addEventListener(
  "click",
  () => {

    transcriptArea.value = "";
    finalText = "";

    localStorage.removeItem(
      "audioTexto_transcripcion"
    );

    setStatus(
      "Texto limpiado."
    );

  }
);

if ("serviceWorker" in navigator) {

 navigator.serviceWorker.register("sw.js");

}