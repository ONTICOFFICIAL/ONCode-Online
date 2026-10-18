const editor = document.getElementById('codeEditor'), preview = document.getElementById('preview'), errorsBox = document.getElementById('errors'), statusBox = document.getElementById('status'), lineCount = document.getElementById('lineCount'), cursorPos = document.getElementById('cursorPos'), fileLabel = document.getElementById('fileLabel'), fileInput = document.getElementById('fileInput'), lineNumbers = document.getElementById('lineNumbers'), highlightLayer = document.getElementById('highlightLayer');
const examples = {
    starter: `# Demonstração ONCode Online 0.2\ntitulo "A minha aplicação ONCode"\nfundo "#f5f7fb"\ntexto "Bem-vindo à ONCode Online!" {\n  tamanho 32\n  fonte "Arial"\n  negrito\n  cor "#245bdb"\n}\nparagrafo true\ntexto "A minha primeira aplicação feita com ONCode."\nimagem.link = "https://placehold.co/520x180/e8efff/245bdb?text=ONCode+Online"\n\nbotao "Mudar todas as cores" {\n  mudardecor aleatorio\n}\n\nbotao "Mudar a cor do primeiro texto" {\n  mudardecor texto.linha(1)\n}`,
    hello: `# O primeiro programa ONCode\ntitulo "Olá, mundo!"\ntexto "Olá, mundo!" {\n  tamanho 36\n  negrito\n  cor "#245bdb"\n}\ntexto "Este é o meu primeiro programa ONCode."`,
    buttons: `titulo "Botões interativos"\ntexto "Experimenta carregar nos botões!" {\n  tamanho 26\n  negrito\n  cor "purple"\n}\ntexto "Eu também posso mudar de cor."\nbotao "Mudar todas as cores" {\n  mudardecor aleatorio\n}\nbotao "Mudar a cor do segundo texto" {\n  mudardecor texto.linha(2)\n}`,
    image: `titulo "Texto e imagem"\ntexto "A tecnologia dá vida às ideias." {\n  tamanho 28\n  fonte "Arial"\n  italico\n  cor "#147d64"\n}\nimagem.link = "https://placehold.co/520x180/e8efff/245bdb?text=Minha+Imagem"`,
    newcommands: `# Comandos experimentais adicionados na 0.2\ntitulo "Novos comandos!"\nfundo "#eef7ff"\ntexto "Este programa usa titulo e fundo." {\n  tamanho 30\n  negrito\n  cor "#174ea6"\n}\nparagrafo true\ntexto "As linhas que começam por # são comentários e não são executadas."`
};
editor.value = examples.starter;
function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function highlight(source) { const lines = source.split(/\r\n|\r|\n/); return lines.map(raw => { if (/^\s*(#|\/\/)/.test(raw))
    return `<span class="comment">${escapeHTML(raw) || ' '}</span>`; let out = escapeHTML(raw); out = out.replace(/("(?:[^"\\]|\\.)*")/g, '<span class="string">$1</span>'); out = out.replace(/\b(\d+)\b/g, '<span class="number">$1</span>'); out = out.replace(/\b(texto|tamanho|fonte|negrito|italico|cor|paragrafo|botao|mudardecor|titulo|fundo)\b/gi, '<span class="command">$1</span>'); out = out.replace(/\b(true|false|aleatorio)\b/gi, '<span class="keyword">$1</span>'); out = out.replace(/(imagem\.link|texto\.linha)/gi, '<span class="property">$1</span>'); out = out.replace(/[{}]/g, '<span class="brace">$&</span>'); return out || ' '; }).join('\n') + '\n'; }
function updateEditorUI() { const n = editor.value.split(/\r\n|\r|\n/).length; lineCount.textContent = `${n} ${n === 1 ? 'linha' : 'linhas'}`; lineNumbers.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); highlightLayer.innerHTML = highlight(editor.value); syncScroll(); const before = editor.value.slice(0, editor.selectionStart), lines = before.split(/\r\n|\r|\n/); cursorPos.textContent = `Linha ${lines.length}, coluna ${lines[lines.length - 1].length + 1}`; }
function syncScroll() { highlightLayer.scrollTop = editor.scrollTop; highlightLayer.scrollLeft = editor.scrollLeft; lineNumbers.scrollTop = editor.scrollTop; }
editor.addEventListener('input', () => { updateEditorUI(); if (fileLabel.textContent !== 'programa.on')
    fileLabel.textContent = 'programa.on'; });
editor.addEventListener('click', updateEditorUI);
editor.addEventListener('keyup', updateEditorUI);
editor.addEventListener('scroll', syncScroll);
editor.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        executeONCode();
        return;
    }

    if (e.key === 'Tab') {
        e.preventDefault();
        editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end');
        updateEditorUI();
        return;
    }

    // Automatically close quotation marks: typing " inserts "" and leaves the cursor inside.
    if (e.key === '"' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        if (start === end && editor.value[start] === '"') {
            e.preventDefault();
            editor.setSelectionRange(start + 1, start + 1);
            updateEditorUI();
            return;
        }
        e.preventDefault();
        const selected = editor.value.slice(start, end);
        editor.setRangeText(`"${selected}"`, start, end, 'select');
        if (start === end) editor.setSelectionRange(start + 1, start + 1);
        updateEditorUI();
        return;
    }

    // Typing { creates a matching }, on separate lines, with an indented line inside.
    if (e.key === '{' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        if (start !== end) return;
        e.preventDefault();
        const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
        const lineBeforeCursor = editor.value.slice(lineStart, start);
        const indent = (lineBeforeCursor.match(/^\s*/) || [''])[0];
        const insertion = `{\n${indent}    \n${indent}}`;
        editor.setRangeText(insertion, start, end, 'end');
        const cursor = start + 2 + indent.length + 4;
        editor.setSelectionRange(cursor, cursor);
        updateEditorUI();
        return;
    }

    // Enter keeps the indentation of the current line.
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
        const lineBeforeCursor = editor.value.slice(lineStart, start);
        const indent = (lineBeforeCursor.match(/^\s*/) || [''])[0];
        e.preventDefault();
        editor.setRangeText(`\n${indent}`, start, end, 'end');
        updateEditorUI();
    }
});
updateEditorUI();
function parseONCode(source) {
    const lines = source.split(/\r\n|\r|\n/), contents = [], texts = [], buttons = [], errors = [];
    let pendingParagraph = false, block = null, pageTitle = '', background = '#f5f7fb';
    const colors = ['red', 'blue', 'green', 'purple', 'orange', 'deeppink', 'black', 'brown', 'darkcyan', 'crimson', 'darkgreen', 'darkmagenta', 'gold', 'teal', 'navy', 'coral', 'white', 'yellow', 'pink', 'gray', 'grey', '#245bdb', '#174ea6', '#147d64'];
    function fail(n, msg) { errors.push({ line: n, message: msg }); }
    function addContent(type, data) { if (pendingParagraph) {
        data.paragrafo_antes = true;
        pendingParagraph = false;
    } contents.push({ type, data }); }
    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i], line = raw.trim(), lower = line.toLowerCase(), n = i + 1;
        if (!line || /^#|^\/\//.test(line))
            continue;
        let m;
        if ((m = line.match(/^titulo\s+"(.*)"\s*;?$/i))) {
            if (block)
                fail(n, "'titulo' deve ficar fora dos blocos.");
            else
                pageTitle = m[1];
            continue;
        }
        if ((m = line.match(/^fundo\s+"([^"\n]+)"\s*;?$/i))) {
            if (block)
                fail(n, "'fundo' deve ficar fora dos blocos.");
            else if (!/^[a-zA-Z]+$|^#[0-9a-fA-F]{3,8}$/.test(m[1]))
                fail(n, 'Cor de fundo inválida. Usa um nome ou código hexadecimal.');
            else
                background = m[1];
            continue;
        }
        if ((m = line.match(/^texto\s+"(.*)"\s*\{$/i))) {
            if (block) {
                fail(n, 'Não podes abrir um novo bloco antes de fechar o atual.');
                continue;
            }
            const d = { message: m[1], size: 28, font: 'Arial', bold: false, italic: false, color: 'black', line: n };
            texts.push(d);
            addContent('text', d);
            block = { type: 'text', data: d, line: n };
            continue;
        }
        if ((m = line.match(/^texto\s+"(.*)"\s*;?$/i))) {
            if (block) {
                fail(n, 'Não podes declarar texto dentro de outro bloco.');
                continue;
            }
            const d = { message: m[1], size: 28, font: 'Arial', bold: false, italic: false, color: 'black', line: n };
            texts.push(d);
            addContent('text', d);
            continue;
        }
        if (/^paragrafo\s+true\s*;?$/i.test(line)) {
            if (block)
                fail(n, "'paragrafo true' deve ficar fora de blocos.");
            else
                pendingParagraph = true;
            continue;
        }
        if (/^paragrafo\s+false\s*;?$/i.test(line)) {
            if (block)
                fail(n, "'paragrafo false' deve ficar fora de blocos.");
            else
                pendingParagraph = false;
            continue;
        }
        if (lower.startsWith('imagem.link')) {
            m = line.match(/^imagem\.link\s*=\s*"(https?:\/\/[^"\s]+)"\s*;?$/i);
            if (block)
                fail(n, "'imagem.link' deve ficar fora de blocos.");
            else if (!m)
                fail(n, 'Usa imagem.link = "https://exemplo.com/imagem.png".');
            else
                addContent('image', { url: m[1], line: n });
            continue;
        }
        if ((m = line.match(/^botao\s+"(.*)"\s*\{$/i))) {
            if (block) {
                fail(n, 'Não podes abrir um botão antes de fechar o bloco atual.');
                continue;
            }
            const d = { name: m[1], action: null, line: n };
            buttons.push(d);
            block = { type: 'button', data: d, line: n };
            continue;
        }
        if (lower.startsWith('tamanho ')) {
            if (!block || block.type !== 'text') {
                fail(n, "'tamanho' deve estar dentro de um bloco texto.");
                continue;
            }
            const size = Number(line.slice(8).trim());
            if (!Number.isInteger(size) || size < 1 || size > 300)
                fail(n, 'Tamanho inválido. Usa um número entre 1 e 300.');
            else
                block.data.size = size;
            continue;
        }
        if (lower.startsWith('fonte ')) {
            if (!block || block.type !== 'text') {
                fail(n, "'fonte' deve estar dentro de um bloco texto.");
                continue;
            }
            m = line.match(/^fonte\s+"(.+)"\s*;?$/i);
            if (!m)
                fail(n, 'Escreve a fonte entre aspas, por exemplo: fonte "Arial".');
            else
                block.data.font = m[1];
            continue;
        }
        if (lower === 'negrito' || lower === 'italico') {
            if (!block || block.type !== 'text')
                fail(n, `'${line}' deve estar dentro de um bloco texto.`);
            else if (lower === 'negrito')
                block.data.bold = true;
            else
                block.data.italic = true;
            continue;
        }
        if (lower.startsWith('cor ')) {
            if (!block || block.type !== 'text') {
                fail(n, "'cor' deve estar dentro de um bloco texto.");
                continue;
            }
            m = line.match(/^cor\s+"([^"]+)"\s*;?$/i);
            if (!m) {
                fail(n, 'Escreve a cor entre aspas, por exemplo: cor "blue".');
                continue;
            }
            const color = m[1].trim();
            if (!/^[a-zA-Z]+$|^#[0-9a-fA-F]{3,8}$/.test(color))
                fail(n, 'Cor inválida. Usa um nome como "blue" ou um código hexadecimal.');
            else
                block.data.color = color;
            continue;
        }
        if (lower === 'mudardecor aleatorio') {
            if (!block || block.type !== 'button')
                fail(n, "'mudardecor aleatorio' deve estar dentro de um bloco botao.");
            else if (block.data.action)
                fail(n, 'O botão já tem uma função.');
            else
                block.data.action = { type: 'all' };
            continue;
        }
        if ((m = line.match(/^mudardecor\s+texto\.linha\((\d+)\)\s*;?$/i))) {
            if (!block || block.type !== 'button')
                fail(n, "'mudardecor texto.linha(N)' deve estar dentro de um bloco botao.");
            else if (block.data.action)
                fail(n, 'O botão já tem uma função.');
            else if (Number(m[1]) < 1)
                fail(n, 'O número do texto começa em 1.');
            else
                block.data.action = { type: 'one', index: Number(m[1]) };
            continue;
        }
        if (line === '}') {
            if (!block)
                fail(n, 'Não existe nenhum bloco aberto para fechar.');
            else {
                if (block.type === 'button' && !block.data.action)
                    fail(block.line, 'Botão sem função.');
                block = null;
            }
            continue;
        }
        fail(n, `Comando ONCode inválido: ${line}`);
    }
    if (block)
        fail(block.line, 'Falta fechar o bloco com }.');
    for (const b of buttons)
        if (b.action?.type === 'one' && b.action.index > texts.length)
            fail(b.line, `O botão "${b.name}" tenta alterar o texto ${b.action.index}, mas só existem ${texts.length} textos.`);
    return { errors, contents, texts, buttons, colors, pageTitle, background };
}
function showErrors(errors) { if (!errors.length) {
    errorsBox.textContent = 'Execução concluída sem erros.';
    return;
} errorsBox.replaceChildren(); for (const err of errors) {
    const line = document.createElement('div');
    line.className = 'error-line';
    line.textContent = `Linha ${err.line}: ${err.message}`;
    line.style.cursor = 'pointer';
    line.title = 'Clica para ir para esta linha';
    line.addEventListener('click', () => { const start = editor.value.split(/\r\n|\r|\n/).slice(0, err.line - 1).join('\n').length + (err.line > 1 ? 1 : 0); editor.focus(); editor.setSelectionRange(start, start); const lh = Number(getComputedStyle(editor).lineHeight.replace('px', '')) || 25; editor.scrollTop = (err.line - 1) * lh; updateEditorUI(); });
    errorsBox.appendChild(line);
} const note = document.createElement('div'); note.textContent = 'Corrige os erros acima e volta a executar.'; note.style.marginTop = '8px'; errorsBox.appendChild(note); }
function executeONCode() {
    const result = parseONCode(editor.value);
    showErrors(result.errors);
    if (result.errors.length) {
        statusBox.textContent = `Foram encontrados ${result.errors.length} erro(s). Clica num erro da consola para saltar para a linha.`;
        statusBox.className = 'status failure';
        return;
    }
    preview.replaceChildren();
    preview.style.background = result.background;
    const elementsByTextIndex = [];
    for (const item of result.contents) {
        const d = item.data;
        if (d.paragrafo_antes) {
            const spacer = document.createElement('div');
            spacer.className = 'separador-paragrafo';
            spacer.setAttribute('aria-hidden', 'true');
            preview.appendChild(spacer);
        }
        if (item.type === 'text') {
            const p = document.createElement('p');
            p.textContent = d.message;
            p.style.fontSize = `${d.size}px`;
            p.style.fontFamily = d.font;
            p.style.fontWeight = d.bold ? 'bold' : 'normal';
            p.style.fontStyle = d.italic ? 'italic' : 'normal';
            p.style.color = d.color;
            preview.appendChild(p);
            elementsByTextIndex.push(p);
        }
        else if (item.type === 'image') {
            const img = document.createElement('img');
            img.className = 'oncode-imagem';
            img.src = d.url;
            img.alt = 'Imagem adicionada com ONCode';
            img.loading = 'lazy';
            img.onerror = () => { img.alt = 'Não foi possível carregar esta imagem. Verifica o link.'; img.style.minHeight = '40px'; };
            preview.appendChild(img);
        }
    }
    if (result.pageTitle) {
        const heading = document.createElement('h2');
        heading.textContent = result.pageTitle;
        heading.style.margin = '0 0 18px';
        heading.style.color = '#18243a';
        preview.prepend(heading);
    }
    for (const bd of result.buttons) {
        const button = document.createElement('button');
        button.textContent = bd.name;
        button.addEventListener('click', () => { const choose = () => result.colors[Math.floor(Math.random() * result.colors.length)]; if (bd.action.type === 'all')
            elementsByTextIndex.forEach(el => el.style.color = choose()); if (bd.action.type === 'one') {
            const el = elementsByTextIndex[bd.action.index - 1];
            if (el)
                el.style.color = choose();
        } });
        preview.appendChild(button);
    }
    statusBox.textContent = `Executado com sucesso: ${result.texts.length} texto(s), ${result.contents.filter(x => x.type === 'image').length} imagem(ns), ${result.buttons.length} botão(ões).`;
    statusBox.className = 'status success';
}
document.getElementById('runBtn').addEventListener('click', executeONCode);
document.getElementById('clearBtn').addEventListener('click', () => { preview.replaceChildren(); statusBox.textContent = 'Resultado limpo. Carrega em Executar para voltar a mostrar a aplicação.'; statusBox.className = 'status'; });
document.getElementById('clearConsoleBtn').addEventListener('click', () => { errorsBox.textContent = 'Consola limpa.'; });
document.getElementById('clearCodeBtn').addEventListener('click', () => { if (editor.value && !confirm('Queres mesmo apagar todo o código?'))
    return; editor.value = ''; fileLabel.textContent = 'programa.on'; updateEditorUI(); editor.focus(); statusBox.textContent = 'Editor limpo. Escreve código ou carrega num exemplo.'; statusBox.className = 'status'; });
document.getElementById('loadExampleBtn').addEventListener('click', () => { editor.value = examples[document.getElementById('exampleSelect').value] || examples.starter; fileLabel.textContent = 'programa.on'; updateEditorUI(); statusBox.textContent = 'Exemplo carregado. Carrega em Executar para o testar.'; statusBox.className = 'status'; });
document.getElementById('saveBtn').addEventListener('click', () => { const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = fileLabel.textContent.endsWith('.on') ? fileLabel.textContent : 'programa.on'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); });
document.getElementById('openBtn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => { const file = fileInput.files?.[0]; if (!file)
    return; editor.value = await file.text(); fileLabel.textContent = file.name; updateEditorUI(); statusBox.textContent = `Ficheiro ${file.name} aberto.`; statusBox.className = 'status'; fileInput.value = ''; });
executeONCode();
