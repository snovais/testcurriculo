/* =========================
   VARIÁVEIS PRINCIPAIS
   ========================= */

// Modelo de currículo selecionado
let currentModel = 'formacao';

// Guarda o acesso à câmera
let stream = null;

// Guarda a foto em formato Data URL
let photoDataUrl = null;


/* =========================
   INFORMAÇÕES DOS MODELOS
   ========================= */

const MODEL_INFO = {
  // Modelo para quem não possui experiência
  formacao: {
    name: 'Somente formação acadêmica',
    color: '#c0e0fc',
    code: '01-FORMACAO'
  },

  // Modelo para quem possui experiência
  experiencia: {
    name: 'Com experiência',
    color: '#c0e0fc',
    code: '02-EXPERIENCIA'
  }
};


/* =========================
   NAVEGAÇÃO ENTRE TELAS
   ========================= */

// Abre o formulário do modelo escolhido
function goToForm(model) {
  currentModel = model;

  const info = MODEL_INFO[model];

  const screenWelcome = document.getElementById('screen-welcome');
  const screenForm = document.getElementById('screen-form');

  if (screenWelcome) screenWelcome.classList.remove('active');
  if (screenForm) {
    screenForm.classList.add('active');
    screenForm.style.setProperty('--model-color', info.color);
  }

  const formChip = document.getElementById('form-chip');
  if (formChip) formChip.textContent = 'MODELO ' + (model === 'formacao' ? '01' : '02');

  const formTitle = document.getElementById('form-title');
  if (formTitle) formTitle.textContent = info.name;

  const protoModel = document.getElementById('proto-model');
  if (protoModel) protoModel.textContent = info.code;

  const isFormacao = model === 'formacao';

  const fieldExp = document.getElementById('field-exp');
  if (fieldExp) fieldExp.style.display = 'block';

  const expReqMark = document.getElementById('exp-req-mark');
  if (expReqMark) {
    expReqMark.style.display = isFormacao ? 'none' : 'inline';
    expReqMark.textContent = '*';
  }

  resetForm();
}

// Volta para a tela inicial
function goToWelcome() {
  stopCamera();

  const screenForm = document.getElementById('screen-form');
  const screenWelcome = document.getElementById('screen-welcome');

  if (screenForm) screenForm.classList.remove('active');
  if (screenWelcome) screenWelcome.classList.add('active');
}


/* =========================
   RESET DO FORMULÁRIO
   ========================= */

// Limpa os dados do formulário e da foto
function resetForm() {
  const form = document.getElementById('curriculo-form');
  if (form) form.reset();

  // Remove os erros dos campos
  document.querySelectorAll('.err').forEach(el => el.classList.remove('err'));
  document.querySelectorAll('.errmsg').forEach(el => el.classList.remove('show'));

  photoDataUrl = null;

  stopCamera();

  // Limpa a visualização da foto
  const pv = document.getElementById('photo-preview');
  if (pv) {
    pv.style.display = 'none';
    pv.src = '';
  }

  const placeholder = document.getElementById('booth-placeholder');
  if (placeholder) placeholder.style.display = 'flex';

  const video = document.getElementById('video');
  if (video) video.style.display = 'none';

  const btnCapture = document.getElementById('btn-capture');
  if (btnCapture) btnCapture.style.display = 'none';

  const btnRetake = document.getElementById('btn-retake');
  if (btnRetake) btnRetake.style.display = 'none';
}


/* =========================
   MÁSCARA DO CPF
   ========================= */

// Formata o CPF enquanto o usuário digita
const cpfInput = document.getElementById('f-cpf');
if (cpfInput) {
  cpfInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2')
         .replace(/(\d{3})(\d)/, '$1.$2')
         .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  });
}


/* =========================
   CÂMERA
   ========================= */

// Ativa ou desativa a câmera
async function toggleCamera() {
  if (stream) {
    stopCamera();
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });

    const video = document.getElementById('video');
    if (video) {
      video.srcObject = stream;
      await video.play();
      video.style.display = 'block';
    }

    const placeholder = document.getElementById('booth-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const pv = document.getElementById('photo-preview');
    if (pv) pv.style.display = 'none';

    const btnCapture = document.getElementById('btn-capture');
    if (btnCapture) btnCapture.style.display = 'inline-block';

  } catch (err) {
    alert('Não foi possível acessar a câmera');
  }
}

// Desliga a câmera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }

  const video = document.getElementById('video');
  if (video) video.style.display = 'none';

  const btnCapture = document.getElementById('btn-capture');
  if (btnCapture) btnCapture.style.display = 'none';
}


/* =========================
   CAPTURA DA FOTO
   ========================= */

// Captura uma foto utilizando a câmera
function capturePhoto() {
  const video = document.getElementById('video');
  const canvas = document.getElementById('capture-canvas');

  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // Converte a imagem sempre para JPEG
  photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

  const pv = document.getElementById('photo-preview');
  if (pv) {
    pv.src = photoDataUrl;
    pv.style.display = 'block';
  }

  video.style.display = 'none';

  stopCamera();

  const btnRetake = document.getElementById('btn-retake');
  if (btnRetake) btnRetake.style.display = 'inline-block';

  const placeholder = document.getElementById('booth-placeholder');
  if (placeholder) placeholder.style.display = 'none';
}


/* =========================
   FOTO DA GALERIA
   ========================= */

// Processa uma imagem escolhida pelo usuário
function handleFileSelect(e) {
  const file = e.target.files[0];

  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert('Imagem muito grande. Máximo 2MB.');
    return;
  }

  const reader = new FileReader();

  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      // Converte para JPEG via Canvas temporário para compatibilidade total com o jsPDF
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const pv = document.getElementById('photo-preview');
      if (pv) {
        pv.src = photoDataUrl;
        pv.style.display = 'block';
      }

      const placeholder = document.getElementById('booth-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      const video = document.getElementById('video');
      if (video) video.style.display = 'none';

      const btnRetake = document.getElementById('btn-retake');
      if (btnRetake) btnRetake.style.display = 'inline-block';
    };
    img.src = ev.target.result;
  };

  reader.readAsDataURL(file);
}


/* =========================
   REMOVER FOTO
   ========================= */

// Remove a foto selecionada
function retakePhoto() {
  photoDataUrl = null;

  const pv = document.getElementById('photo-preview');
  if (pv) pv.style.display = 'none';

  const placeholder = document.getElementById('booth-placeholder');
  if (placeholder) placeholder.style.display = 'flex';

  const btnRetake = document.getElementById('btn-retake');
  if (btnRetake) btnRetake.style.display = 'none';

  const fileInput = document.getElementById('f-foto-file');
  if (fileInput) fileInput.value = '';
}


/* =========================
   VALIDAÇÃO DOS CAMPOS
   ========================= */

// Adiciona ou remove o estado de erro de um campo
function setError(input, has) {
  if (!input) return;

  input.classList.toggle('err', has);

  const msg = input.parentElement ? input.parentElement.querySelector('.errmsg') : null;

  if (msg) {
    msg.classList.toggle('show', has);
  }
}


/* =========================
   ENVIO DO FORMULÁRIO
   ========================= */

const curriculoForm = document.getElementById('curriculo-form');
if (curriculoForm) {
  curriculoForm.addEventListener('submit', function(e) {
    e.preventDefault();

    try {
      let valid = true;

      // Seleciona os campos do formulário
      const nome = document.getElementById('f-nome');
      const idade = document.getElementById('f-idade');
      const cidade = document.getElementById('f-cidade');
      const estado = document.getElementById('f-estado');
      const email = document.getElementById('f-email');

      const inst = document.getElementById('f-inst');
      const curso = document.getElementById('f-curso');
      const ano = document.getElementById('f-ano');

      const exp = document.getElementById('f-experiencia');

      const checks = [
        [nome, nome && nome.value.trim().length >= 3],
        [idade, idade && idade.value && parseInt(idade.value) >= 14],
        [cidade, cidade && cidade.value.trim().length >= 2],
        [estado, estado && !!estado.value],
        [email, email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)],
        [inst, inst && inst.value.trim().length >= 2],
        [curso, curso && curso.value.trim().length >= 2],
        [ano, ano && ano.value.trim().length >= 2],
      ];

      // Verifica cada campo
      checks.forEach(([inp, ok]) => {
        if (inp) {
          setError(inp, !ok);
          if (!ok) valid = false;
        }
      });

      // Experiência é obrigatória somente no modelo 02
      if (exp) {
        if (currentModel === 'experiencia') {
          const okExp = exp.value.trim().length >= 3;
          setError(exp, !okExp);
          if (!okExp) valid = false;
        } else {
          setError(exp, false);
        }
      }

      // Para o processo caso exista algum erro
      if (!valid) return;

      /* =========================
         COLETA DOS DADOS
         ========================= */

      const getVal = id => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      const dados = {
        nome: getVal('f-nome'),
        cidade: getVal('f-cidade'),
        estado: getVal('f-estado'),
        email: getVal('f-email'),
        tel: getVal('f-tel'),
        inst: getVal('f-inst'),
        curso: getVal('f-curso'),
        ano: getVal('f-ano'),
        experiencia: getVal('f-experiencia'),
        habilidades: getVal('f-habilidades'),
        idioma: getVal('f-idioma'),
        foto: photoDataUrl
      };

      /* =========================
         GERAÇÃO DO PDF
         ========================= */

      if (currentModel === 'formacao') {
        gerarPdfFormacao(dados);
      } else {
        gerarPdfExperiencia(dados);
      }

    } catch (err) {
      console.error('Erro ao processar o formulário:', err);
      alert('Ocorreu um erro inesperado ao gerar o PDF: ' + err.message);
    }
  });
}


/* =========================
   BASE DO PDF
   ========================= */

// Cria a estrutura básica do currículo
function gerarPdfBase(d) {
  // Suporte flexível às duas vias de carregamento do UMD jsPDF
  const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;

  if (!jsPDFClass) {
    throw new Error('A biblioteca jsPDF não foi encontrada na página.');
  }

  // Cria um PDF no formato A4
  const doc = new jsPDFClass({
    unit: 'mm',
    format: 'a4'
  });

  // Define a largura da lateral
  const sidebarW = 60;

  // Cria o fundo azul da lateral
  doc.setFillColor(192, 224, 252);
  doc.rect(0, 0, sidebarW, 297, 'F');

  let sideY = 12;

  // Adiciona a foto caso exista
  if (d.foto && typeof d.foto === 'string' && d.foto.startsWith('data:image/')) {
    try {
      doc.addImage(d.foto, 'JPEG', 11, sideY, 38, 38);
      sideY += 44;
    } catch (e) {
      console.warn('Falha ao inserir a imagem no documento:', e);
      sideY += 2;
    }
  } else {
    sideY += 2;
  }

  // Cor dos textos principais do PDF
  const dark = [30, 58, 95];

  /* =========================
     FUNÇÕES DA LATERAL
     ========================= */

  function sideTitle(t, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(t.toUpperCase(), 10, y);
    y += 2.5;

    doc.setDrawColor(dark[0], dark[1], dark[2]);
    doc.setLineWidth(0.3);
    doc.line(10, y, sidebarW - 10, y);
    y += 5;

    return y;
  }

  function sideText(txt, y, size = 8, bold = false) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(dark[0], dark[1], dark[2]);

    const lines = doc.splitTextToSize(String(txt || ''), sidebarW - 20);
    doc.text(lines, 10, y);

    return y + lines.length * 3.2 + 2;
  }

  /* =========================
     INFORMAÇÕES DA LATERAL
     ========================= */

  sideY = sideTitle('Contato', sideY);

  sideY = sideText(`${d.cidade} / ${d.estado}`, sideY, 7.5, true);

  if (d.tel) sideY = sideText(d.tel, sideY, 7.5, false);
  if (d.email) sideY = sideText(d.email, sideY, 7, false);

  sideY = sideTitle('Formação Acadêmica', sideY);

  if (d.curso) sideY = sideText(d.curso, sideY, 8, true);
  if (d.inst) sideY = sideText(d.inst, sideY, 7.5, false);
  if (d.ano) sideY = sideText(d.ano, sideY, 7, false);

  if (d.idioma) {
    sideY = sideTitle('Idiomas', sideY);
    sideY = sideText(d.idioma, sideY, 7.5, false);
  }

  if (d.habilidades) {
    sideY = sideTitle('Habilidades', sideY);
    sideY = sideText(d.habilidades, sideY, 7.5, false);
  }

  /* =========================
     ÁREA PRINCIPAL DO PDF
     ========================= */

  const mainX = sidebarW + 10;
  let my = 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(dark[0], dark[1], dark[2]);

  // Exibe o nome do candidato em destaque
  const nomeU = (d.nome || '').toUpperCase();
  doc.text(nomeU, mainX, my);

  my += 9;

  return {
    doc,
    mainX,
    my,
    dark
  };
}


/* =========================
   PDF - MODELO FORMAÇÃO
   ========================= */

// Gera o currículo do modelo 01
function gerarPdfFormacao(d) {
  try {
    const { doc, mainX, my, dark } = gerarPdfBase(d);
    let y = my;

    function secTitle(t) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(t.toUpperCase(), mainX, y);
      y += 3;

      doc.setDrawColor(dark[0], dark[1], dark[2]);
      doc.setLineWidth(0.4);
      doc.line(mainX, y, 200, y);
      y += 7;
    }

    function body(txt) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      const lines = doc.splitTextToSize(String(txt || ''), 210 - mainX - 10);

      if (y + lines.length * 4 > 280) {
        lines.length = Math.floor((280 - y) / 4);
      }

      doc.text(lines, mainX, y);
      y += lines.length * 4 + 8;
    }

    if (d.experiencia) {
      secTitle('Experiência Profissional');
      body(d.experiencia);
    }

    secTitle('Cursos Complementares');
    body(
      d.habilidades
        ? d.habilidades
        : 'Informática Básica, Pacote Office, Boa Comunicação, Trabalho em Equipe.'
    );

    // Salva o PDF no computador
    doc.save(`curriculo-${slug(d.nome)}-formacao.pdf`);
  } catch (err) {
    console.error('Erro ao gerar PDF de formação:', err);
    alert('Não foi possível gerar o arquivo PDF: ' + err.message);
  }
}


/* =========================
   PDF - MODELO EXPERIÊNCIA
   ========================= */

// Gera o currículo do modelo 02
function gerarPdfExperiencia(d) {
  try {
    const { doc, mainX, my, dark } = gerarPdfBase(d);
    let y = my;

    function secTitle(t) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(t.toUpperCase(), mainX, y);
      y += 3;

      doc.setDrawColor(dark[0], dark[1], dark[2]);
      doc.setLineWidth(0.4);
      doc.line(mainX, y, 200, y);
      y += 7;
    }

    function body(txt) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);

      const lines = doc.splitTextToSize(String(txt || ''), 210 - mainX - 10);

      if (y + lines.length * 4 > 280) {
        lines.length = Math.floor((280 - y) / 4);
      }

      doc.text(lines, mainX, y);
      y += lines.length * 4 + 8;
    }

    secTitle('Resumo');
    body(
      `Profissional com experiência em ${d.experiencia.substring(0, 60)}... Busco oportunidade para aplicar conhecimentos em ${d.curso}.`
    );

    secTitle('Experiência Profissional');
    body(d.experiencia);

    secTitle('Formação Acadêmica');
    body(`${d.curso} - ${d.inst} - ${d.ano}`);

    // Salva o PDF no computador
    doc.save(`curriculo-${slug(d.nome)}-experiencia.pdf`);
  } catch (err) {
    console.error('Erro ao gerar PDF de experiência:', err);
    alert('Não foi possível gerar o arquivo PDF: ' + err.message);
  }
}


/* =========================
   NOME DO ARQUIVO (SLUG)
   ========================= */

// Transforma o nome em um formato adequado para o arquivo PDF
function slug(s) {
  if (!s || typeof s !== 'string') return 'candidato';

  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'candidato';
}