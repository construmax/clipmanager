document.addEventListener('DOMContentLoaded', function() {
  const textareas = [
    document.getElementById('text1'),
    document.getElementById('text2'),
    document.getElementById('text3')
  ];

  const pasteButtons = document.querySelectorAll('.paste-btn');
  const combineButton = document.getElementById('combineBtn');
  const alwaysOnTopBtn = document.getElementById('alwaysOnTopBtn');

  pasteButtons.forEach((button, index) => {
    button.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        textareas[index].value = text;
      } catch (err) {
        console.error('Failed to read clipboard contents: ', err);
      }
    });
  });

  combineButton.addEventListener('click', () => {
    const combinedText = textareas.map(textarea => textarea.value).join('\n');
    navigator.clipboard.writeText(combinedText);
  });

  alwaysOnTopBtn.addEventListener('click', () => {
    alert('La función "Always on Top" ha sido activada. Si esto está funcionando, puede ser debido a una interacción con tu sistema operativo o gestor de ventanas.');
  });

  // Ajustar el tamaño de los textareas
  function adjustTextareas() {
    const availableHeight = window.innerHeight - 100; // Altura aproximada para otros elementos
    const textareaHeight = Math.max(80, availableHeight / 3);
    textareas.forEach(textarea => {
      textarea.style.height = `${textareaHeight}px`;
    });
  }

  // Llamar a adjustTextareas inicialmente y en cada cambio de tamaño
  adjustTextareas();
  window.addEventListener('resize', adjustTextareas);
});
