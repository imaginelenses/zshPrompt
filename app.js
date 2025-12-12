// Minimalist Zsh Prompt Configurator JS


const promptInput = document.getElementById('promptInput');
const promptPreview = document.getElementById('promptPreview');
const addElementBtn = document.getElementById('addElementBtn');
const elementSelect = document.getElementById('elementSelect');
const promptBlocks = document.getElementById('promptBlocks');
const copyPromptBtn = document.getElementById('copyPromptBtn');
const customElementInput = document.getElementById('customElementInput');
const addCustomElementBtn = document.getElementById('addCustomElementBtn');

// Zsh prompt elements and their sample values
const zshElements = {
  '%n': 'user',
  '%m': 'host',
  '%M': 'host.full',
  '%~': '~/dir',
  '%1~': '~/dir',
  '%d': '/full/path',
  '%/': '/full/path',
  '%#': '#',
  '%T': '14:23',
  '%@': '02:23pm',
  '%D': '25-12-31',
  ':': ':',
  '@': '@',
  '$': '$',
  ' ': 'whitespace' // Added whitespace option
};

// Updated parsePromptBlocks to handle Zsh color sequences like %F{color} ... %f
function parsePromptBlocks(str) {
  let blocks = [];
  let remaining = str;

  const colorRegex = /^%F\{([^}]+)\}(.*?)%f/; // Matches %F{color} ... %f

  while (remaining.length > 0) {
    let found = false;

    // Check for color sequences first
    const colorMatch = remaining.match(colorRegex);
    if (colorMatch) {
      const color = colorMatch[1];
      const content = colorMatch[2];
      blocks.push({ type: 'element', value: content, color: color, custom: false });
      remaining = remaining.slice(colorMatch[0].length); // Remove the matched color sequence
      found = true;
    }

    if (!found) {
      // Check if the start of the string matches any zshElement
      for (const [key, sample] of Object.entries(zshElements)) {
        if (remaining.startsWith(key)) {
          blocks.push({ type: 'element', value: key, color: '#222', custom: false });
          remaining = remaining.slice(key.length); // Remove the matched element
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // If no zshElement matches, treat the first character as a literal or whitespace
      const char = remaining[0];
      const type = char.trim() === '' ? 'whitespace' : 'literal';
      blocks.push({ type, value: char, color: '#222', custom: type === 'literal' });
      remaining = remaining.slice(1); // Remove the first character
    }
  }

  return blocks;
}

// State: blocks and selected block
let blocks = [];
let selectedBlock = null;

// Disable color selection for whitespace blocks and fix whitespace display in preview
function renderBlocks() {
  promptBlocks.innerHTML = '';
  blocks.forEach((block, i) => {
    const div = document.createElement('div');
    div.className = 'prompt-block btn btn-light' + (selectedBlock === i ? ' selected' : '');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.padding = '5px'; // Add padding for better visibility
    div.style.marginBottom = '5px'; // Add margin for spacing between blocks
    div.style.border = '1px solid #ccc'; // Add border for better visibility
    div.style.borderRadius = '4px'; // Add border radius for rounded corners

    // Create a split button for the element
    const splitButtonDiv = document.createElement('div');
    splitButtonDiv.className = 'btn-group';

    const mainButton = document.createElement('button');
    mainButton.className = 'btn btn-outline-primary';
    mainButton.style.color = block.type === 'whitespace' ? '#000' : block.color; // Disable color for whitespace
    mainButton.textContent = block.type === 'whitespace' ? ' ' : zshElements[block.value] || block.value; // Display space for whitespace

    // log the block type
    console.log('Rendering block type:', block);

    if (block.value === ' ') {
      mainButton.disabled = true; // Disable the button for whitespace blocks
    } 
    mainButton.addEventListener('click', () => {
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = block.color;
      colorInput.style.position = 'absolute';
      colorInput.style.opacity = '0';
      colorInput.addEventListener('input', (e) => {
        block.color = e.target.value;
        renderBlocks();
        renderPreview();
        promptInput.value = buildZshPrompt(); // Update the input field with the new prompt
      });
      colorInput.click();
    });
    splitButtonDiv.appendChild(mainButton);

    const dropdownButton = document.createElement('button');
    dropdownButton.className = 'btn btn-outline-secondary dropdown-toggle dropdown-toggle-split';
    dropdownButton.type = 'button';
    dropdownButton.setAttribute('data-bs-toggle', 'dropdown');
    dropdownButton.setAttribute('aria-expanded', 'false');
    splitButtonDiv.appendChild(dropdownButton);

    const dropdownMenu = document.createElement('ul');
    dropdownMenu.className = 'dropdown-menu';
    Object.keys(zshElements).forEach(key => {
      const dropdownItem = document.createElement('li');
      const itemButton = document.createElement('button');
      itemButton.className = 'dropdown-item';
      itemButton.innerHTML = `<strong>${key}</strong> ${zshElements[key]} `; // Display key and label
      itemButton.addEventListener('click', () => {
        block.value = key;
        renderBlocks();
        renderPreview();
        promptInput.value = buildZshPrompt(); // Update the input field with the new prompt
      });
      dropdownItem.appendChild(itemButton);
      dropdownMenu.appendChild(dropdownItem);
    });
    splitButtonDiv.appendChild(dropdownMenu);

    div.appendChild(splitButtonDiv);
    promptBlocks.appendChild(div);
  });
  enableDragAndDrop();
}

// Enable drag-and-drop functionality for rearranging blocks
function enableDragAndDrop() {
  let dragSrcEl = null;

  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    this.classList.add('dragging');
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    this.classList.add('over');
    e.dataTransfer.dropEffect = 'move';
    return false;
  }

  function handleDragEnter() {
    this.classList.add('over');
  }

  function handleDragLeave() {
    this.classList.remove('over');
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    if (dragSrcEl !== this) {
      const srcIndex = Array.from(promptBlocks.children).indexOf(dragSrcEl);
      const targetIndex = Array.from(promptBlocks.children).indexOf(this);
      const temp = blocks[srcIndex];
      blocks[srcIndex] = blocks[targetIndex];
      blocks[targetIndex] = temp;
      renderBlocks();
      renderPreview();
      promptInput.value = buildZshPrompt(); // Update the input field with the new prompt
    }
    return false;
  }

  function handleDragEnd() {
    this.classList.remove('dragging');
    Array.from(promptBlocks.children).forEach(child => child.classList.remove('over'));
  }

  Array.from(promptBlocks.children).forEach(block => {
    block.setAttribute('draggable', 'true');
    block.addEventListener('dragstart', handleDragStart);
    block.addEventListener('dragover', handleDragOver);
    block.addEventListener('dragenter', handleDragEnter);
    block.addEventListener('dragleave', handleDragLeave);
    block.addEventListener('drop', handleDrop);
    block.addEventListener('dragend', handleDragEnd);
  });
}

function renderPreview() {
  promptPreview.innerHTML = blocks.map(block => {
    const val = block.value === ' ' ? ' ' : zshElements[block.value] || block.value; // Display space for whitespace
    if (block.value === ' ') {
      return '<span>' + val.replace(/ /g, '&nbsp;') + '</span>';
    }
    return '<span style="color:' + block.color + '">' + val + '</span>';
  }).join('');
}

function colorToZsh(color) {
  // Convert #RRGGBB to zsh color name or hex, fallback to hex
  // Zsh supports named colors: black, red, green, yellow, blue, magenta, cyan, white, etc.
  // We'll use hex for custom colors
  const named = {
    '#000000': 'black', '#ff0000': 'red', '#00ff00': 'green', '#ffff00': 'yellow',
    '#0000ff': 'blue', '#ff00ff': 'magenta', '#00ffff': 'cyan', '#ffffff': 'white',
    '#222222': 'white', '#222': 'white', '#808080': 'grey', '#c0c0c0': 'grey'
  };
  const hex = color.toLowerCase();
  return named[hex] || hex;
}

function buildZshPrompt() {
  let out = '';
  blocks.forEach(block => {
    if (block.type === 'whitespace') {
      out += block.value;
    } else if (block.color && block.color !== '#222' && block.color !== '#222222') {
      out += `%F{${colorToZsh(block.color)}}${block.value}%f`;
    } else {
      out += block.value;
    }
  });
  return out;
}

function updateFromInput() {
  blocks = parsePromptBlocks(promptInput.value);
  renderBlocks();
  renderPreview();
}

// Removed the visualize button
// visualizeBtn.addEventListener('click', () => {
//   // Always re-parse and re-render, and reset selected block
//   selectedBlock = null;
//   updateFromInput();
// });

addElementBtn.addEventListener('click', () => {
  const el = elementSelect.value;
  promptInput.value += el;
  updateFromInput();
});

addCustomElementBtn.addEventListener('click', () => {
  const val = customElementInput.value;
  if (val) {
    promptInput.value += val;
    customElementInput.value = '';
    updateFromInput();
  }
});

promptInput.addEventListener('input', updateFromInput);

copyPromptBtn.addEventListener('click', () => {
  const zshPrompt = buildZshPrompt(); // Generate the correct Zsh prompt string
  navigator.clipboard.writeText(zshPrompt).then(() => {
    copyPromptBtn.textContent = 'Copied!';
    setTimeout(() => copyPromptBtn.textContent = 'Copy Final Prompt', 1200);
  }).catch(err => {
    console.error('Failed to copy Zsh prompt:', err);
  });
});

// Autofocus the input field on page load
promptInput.focus();

// Initial render
updateFromInput();
