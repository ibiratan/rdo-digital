/* =========================================================
   RDO DIGITAL — app.js
   ========================================================= */

const STORAGE_KEY = "rdo_digital_salvo_v6";
const STORAGE_KEY_DATA_RDO = "rdo_digital_data_ultimo_rdo";

/* ---------- Utilidades ---------- */

function normalizarLinhas(texto) {
  return String(texto || "").replace(/\r\n?/g, "\n").split("\n");
}

function formatarLista(texto) {
  const linhas = normalizarLinhas(texto)
    .map(l => l.trim())
    .filter(l => l !== "");
  if (linhas.length === 0) return "";
  return linhas.map(l => `* ${l}`).join("\n");
}

function hojeISO() {
  const hoje = new Date();
  const offset = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje - offset).toISOString().slice(0, 10);
}

function ontemISO() {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const offset = ontem.getTimezoneOffset() * 60000;
  return new Date(ontem - offset).toISOString().slice(0, 10);
}

/* ---------- Salvamento local ---------- */

function coletarDados() {
  return {
    data: document.getElementById("inpData").value,
    horario: document.getElementById("inpHorario").value,
    fa: document.getElementById("inpFA").value,
    local: document.getElementById("inpLocal").value,
    mecanica: document.getElementById("inpMecanica").value,
    eletrica: document.getElementById("inpEletrica").value,
    lideranca: document.getElementById("inpLideranca").value,
    equipe: document.getElementById("inpEquipe").value,
    horarioQuente: document.getElementById("inpHorarioQuente").value,
    bombeiro: document.getElementById("inpBombeiro").value,
    equipamentos: document.getElementById("inpEquipamentos").value,
    seguranca: document.getElementById("inpSeguranca").value
  };
}

function salvarLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coletarDados()));
    // Guarda a data do RDO no momento do salvamento
    localStorage.setItem(STORAGE_KEY_DATA_RDO, document.getElementById("inpData").value);
  } catch (e) {
    console.warn("Não foi possível salvar:", e);
  }

  const status = document.getElementById("statusSalvo");
  if (!status) return;
  status.style.display = "block";
  status.textContent = "💾 Salvando...";
  status.style.color = "#e67e22";
  clearTimeout(window._saveTimer);
  window._saveTimer = setTimeout(() => {
    status.textContent = "✔ Salvo no celular";
    status.style.color = "#27ae60";
  }, 400);
}

function carregarLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const dados = JSON.parse(raw);
    if (!dados || typeof dados !== "object") return null;
    return dados;
  } catch (e) {
    console.warn("Erro ao carregar dados:", e);
    return null;
  }
}

/* ---------- Geração do texto do RDO ---------- */

function gerarTexto() {
  const dataISO = document.getElementById("inpData").value;
  let dataFormatada = "";
  if (dataISO) {
    const [ano, mes, dia] = dataISO.split("-");
    dataFormatada = `${dia}/${mes}/${ano}`;
  }

  const fa = document.getElementById("inpFA").value;
  const horario = document.getElementById("inpHorario").value;
  const local = document.getElementById("inpLocal").value;
  const mecanica = document.getElementById("inpMecanica").value;
  const eletrica = document.getElementById("inpEletrica").value;
  const lideranca = document.getElementById("inpLideranca").value;
  const equipe = document.getElementById("inpEquipe").value;
  const horarioQuente = document.getElementById("inpHorarioQuente").value;
  const bombeiro = document.getElementById("inpBombeiro").value;
  const equipamentos = document.getElementById("inpEquipamentos").value;
  const seguranca = document.getElementById("inpSeguranca").value;

  let texto = `*RDO – FA ${fa}*\n`;
  texto += `${dataFormatada} | ${horario}\n\n`;
  texto += `*Local:* ${local}\n\n`;

  texto += `*Atividades*\n\n`;
  if (mecanica.trim()) texto += `*Mecânica:*\n${formatarLista(mecanica)}\n\n`;
  if (eletrica.trim()) texto += `*Elétrica:*\n${formatarLista(eletrica)}\n\n`;

  texto += `*Liderança Falcare*\n`;
  texto += `* ${lideranca}\n\n`;

  texto += `*Equipe*\n`;
  texto += formatarLista(equipe) + `\n\n`;

  texto += `*Serviço a quente:* Sim (liberação mensal)\n`;
  texto += `* ${horarioQuente}\n`;
  texto += `* Bombeiro: ${bombeiro}\n\n`;

  texto += `*Travamento:* N/A\n\n`;

  texto += `*Equipamentos*\n`;
  texto += formatarLista(equipamentos) + `\n\n`;

  texto += `*Segurança*\n`;
  texto += formatarLista(seguranca) + `\n\n`;

  texto += `*Anexos DDS*\n`;
  texto += `• (Ver foto anexa)\n\n`;

  texto += `*Foto do isolamento de área*\n`;
  texto += `• (Ver foto anexa)\n\n`;

  texto += `*RDO finalizado*`;

  document.getElementById("resultado").value = texto;
}

/* ---------- Preview de imagem ---------- */

const LIMITE_FOTO_MB = 10;

function previewImagem(input, imgId, nomeId) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Por favor, selecione um arquivo de imagem.");
    input.value = "";
    return;
  }

  if (file.size > LIMITE_FOTO_MB * 1024 * 1024) {
    alert(`A imagem é muito grande (máx ${LIMITE_FOTO_MB}MB).`);
    input.value = "";
    return;
  }

  const imgPreview = document.getElementById(imgId);
  const nomeEl = document.getElementById(nomeId);
  const reader = new FileReader();

  reader.onload = function (e) {
    imgPreview.src = e.target.result;
    imgPreview.style.display = "block";
    if (nomeEl) nomeEl.style.display = "block";
  };
  reader.onerror = function () {
    alert("Erro ao ler a imagem. Tente outra.");
    input.value = "";
  };

  reader.readAsDataURL(file);
}

/* ---------- Compartilhamento ---------- */

async function enviarTudo() {
  const texto = document.getElementById("resultado").value;
  const fileDDS = document.getElementById("fileDDS").files[0];
  const fileIsolamento = document.getElementById("fileIsolamento").files[0];

  const arquivos = [];
  if (fileDDS) arquivos.push(fileDDS);
  if (fileIsolamento) arquivos.push(fileIsolamento);

  if (arquivos.length > 0 && navigator.canShare && navigator.canShare({ files: arquivos })) {
    try {
      await navigator.share({
        files: arquivos,
        title: "RDO Digital",
        text: texto
      });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.warn("Share nativo falhou, usando fallback:", err);
    }
  }

  alert(
    "Seu navegador não suporta envio de fotos direto pelo botão.\n\n" +
    "O texto será copiado — você precisará anexar as fotos manualmente no WhatsApp."
  );
  copiarTexto(true);
  const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, "_blank");
}

function copiarTexto(silencioso = false) {
  const textarea = document.getElementById("resultado");
  const texto = textarea.value;

  const feito = () => {
    if (!silencioso) alert("Texto copiado! Cole no WhatsApp.");
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(feito).catch(() => {
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      document.execCommand("copy");
      feito();
    });
  } else {
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    document.execCommand("copy");
    feito();
  }
}

/* ---------- Download ---------- */

function baixarArquivo() {
  const texto = document.getElementById("resultado").value;
  const dataISO = document.getElementById("inpData").value || "sem-data";

  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `RDO_${dataISO}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ---------- Inicialização ---------- */

document.addEventListener("DOMContentLoaded", function () {
  const salvo = carregarLocal();

  if (salvo) {
    // Restaura todos os campos do RDO salvo
    const campos = [
      ["inpData", "data"],
      ["inpHorario", "horario"],
      ["inpFA", "fa"],
      ["inpLocal", "local"],
      ["inpMecanica", "mecanica"],
      ["inpEletrica", "eletrica"],
      ["inpLideranca", "lideranca"],
      ["inpEquipe", "equipe"],
      ["inpHorarioQuente", "horarioQuente"],
      ["inpBombeiro", "bombeiro"],
      ["inpEquipamentos", "equipamentos"],
      ["inpSeguranca", "seguranca"]
    ];
    campos.forEach(([id, chave]) => {
      const el = document.getElementById(id);
      if (el && salvo[chave] !== undefined) el.value = salvo[chave];
    });

    // Cenário 3: se o RDO salvo é de ONTEM, atualiza a data pra hoje
    const hoje = hojeISO();
    const ontem = ontemISO();
    const dataSalva = salvo.data || "";

    if (dataSalva === ontem) {
      // RDO salvo ontem → atualiza pra hoje (mantém o resto)
      document.getElementById("inpData").value = hoje;
      // Persiste a atualização já no localStorage
      try {
        const dadosAtualizados = { ...salvo, data: hoje };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosAtualizados));
        localStorage.setItem(STORAGE_KEY_DATA_RDO, hoje);
      } catch (e) { console.warn(e); }
    }
    // Se dataSalva for de outro dia (não ontem, não hoje) → mantém como está
    // Se for de hoje → mantém como está
  } else {
    // Sem RDO salvo → preenche com hoje
    document.getElementById("inpData").value = hojeISO();
  }

  document.querySelectorAll(".auto-save").forEach((el) => {
    el.addEventListener("input", function () {
      gerarTexto();
      salvarLocal();
    });
  });

  gerarTexto();
});