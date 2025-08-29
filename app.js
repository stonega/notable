document.addEventListener('DOMContentLoaded', () => {
  let currentWindowId = null;

  const editor = new EditorJS({
    holder: 'editorjs',
    autofocus: true,
    placeholder: 'Start writing your note...',
    onChange: () => {
      saveActiveNote();
    },
    tools: {
      header: Header,
      paragraph: Paragraph,
    }
  });

  const noteList = document.getElementById('note-list');
  const newNoteButton = document.getElementById('new-note');

  let notes = [];
  let activeNoteId = null;

  async function initialize() {
    const window = await chrome.windows.getCurrent();
    currentWindowId = window.id;

    const data = await chrome.storage.local.get(['notes', 'windowActiveNotes']);
    notes = data.notes || [];
    const windowActiveNotes = data.windowActiveNotes || {};
    activeNoteId = windowActiveNotes[currentWindowId];

    if (!activeNoteId || !notes.find(n => n.id === activeNoteId)) {
      // This is a new window or its note was deleted.
      await createNewNote(true); // create a new note for this window
    } else {
      await loadNote(activeNoteId);
    }

    renderNoteList();
    
    // Add fade-in animation to the app
    document.body.classList.add('fade-in');
  }

  function renderNoteList() {
    // Renders all notes, highlights the one active in this window
    noteList.innerHTML = '';
    
    if (notes.length === 0) {
      const emptyState = document.createElement('li');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">📝</div>
          <div>No notes yet</div>
          <div style="font-size: 0.875rem;">Create your first note above</div>
        </div>
      `;
      noteList.appendChild(emptyState);
      return;
    }
    
    notes.forEach((note, index) => {
      const li = document.createElement('li');
      const noteTitle = getNoteTitle(note);
      
      li.className = note.id === activeNoteId ? 'active' : '';
      li.dataset.noteId = note.id;
      li.setAttribute('role', 'listitem');
      li.setAttribute('tabindex', '0');
      li.setAttribute('aria-label', `Note: ${noteTitle}`);
      
      // Create note title element
      const titleElement = document.createElement('div');
      titleElement.className = 'note-title';
      titleElement.textContent = noteTitle;
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '×';
      deleteBtn.className = 'delete-note';
      deleteBtn.setAttribute('aria-label', `Delete note: ${noteTitle}`);
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });

      li.appendChild(titleElement);
      li.appendChild(deleteBtn);
      
      // Add click and keyboard event listeners
      li.addEventListener('click', () => switchNote(note.id));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          switchNote(note.id);
        }
      });
      
      // Add entrance animation with delay
      li.classList.add('note-item-enter');
      li.style.animationDelay = `${index * 0.05}s`;
      
      noteList.appendChild(li);
    });
  }

  function getNoteTitle(note) {
    if (note.data && note.data.blocks && note.data.blocks.length > 0) {
      const firstBlock = note.data.blocks[0];
      if ((firstBlock.type === 'header' || firstBlock.type === 'paragraph') && firstBlock.data.text) {
        // Strip HTML tags and get clean text
        const cleanText = firstBlock.data.text.replace(/<[^>]*>/g, '').trim();
        return cleanText.substring(0, 30) || 'Untitled Note';
      }
    }
    return 'Untitled Note';
  }

  async function loadNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      // Add loading state
      const editorContainer = document.getElementById('editorjs');
      editorContainer.classList.add('loading');
      
      try {
        await editor.isReady;
        if (note.data && Object.keys(note.data).length > 0) {
          await editor.render(note.data);
        } else {
          await editor.clear();
        }
        activeNoteId = noteId;

        const data = await chrome.storage.local.get('windowActiveNotes');
        const windowActiveNotes = data.windowActiveNotes || {};
        windowActiveNotes[currentWindowId] = activeNoteId;
        await chrome.storage.local.set({ windowActiveNotes });

        renderNoteList();
      } catch (error) {
        console.error('Error loading note:', error);
      } finally {
        // Remove loading state
        editorContainer.classList.remove('loading');
      }
    }
  }

  async function saveActiveNote() {
    if (!activeNoteId) return;

    try {
      const outputData = await editor.save();
      const noteIndex = notes.findIndex(n => n.id === activeNoteId);
      if (noteIndex !== -1) {
        notes[noteIndex].data = outputData;
        await chrome.storage.local.set({ notes });

        // Update the note title in the list with animation
        const li = noteList.querySelector(`[data-note-id="${activeNoteId}"]`);
        if (li) {
          const titleElement = li.querySelector('.note-title');
          if (titleElement) {
            const newTitle = getNoteTitle(notes[noteIndex]);
            if (titleElement.textContent !== newTitle) {
              titleElement.style.opacity = '0.5';
              setTimeout(() => {
                titleElement.textContent = newTitle;
                titleElement.style.opacity = '1';
              }, 150);
            }
          }
        }
      }
    } catch (error) {
      console.error('Saving failed: ', error);
    }
  }

  async function createNewNote(isForNewWindow = false) {
    if (!isForNewWindow) {
      await saveActiveNote();
    }
    
    const newNote = {
      id: `note-${Date.now()}`,
      data: { blocks: [] },
      createdAt: new Date().toISOString(),
    };
    
    notes.unshift(newNote);
    activeNoteId = newNote.id;

    const data = await chrome.storage.local.get('windowActiveNotes');
    const windowActiveNotes = data.windowActiveNotes || {};
    windowActiveNotes[currentWindowId] = activeNoteId;

    await chrome.storage.local.set({ notes, windowActiveNotes });

    await loadNote(activeNoteId);
    renderNoteList();
    
    // Focus the editor after creating a new note
    setTimeout(() => {
      const editorElement = document.querySelector('#editorjs [contenteditable]');
      if (editorElement) {
        editorElement.focus();
      }
    }, 100);
  }

  async function deleteNote(noteIdToDelete) {
    // Add confirmation for delete
    const noteToDelete = notes.find(n => n.id === noteIdToDelete);
    const noteTitle = getNoteTitle(noteToDelete);
    
    if (!confirm(`Are you sure you want to delete "${noteTitle}"?`)) {
      return;
    }
    
    notes = notes.filter(n => n.id !== noteIdToDelete);

    // Find which windows were pointing to this note
    const data = await chrome.storage.local.get('windowActiveNotes');
    const windowActiveNotes = data.windowActiveNotes || {};
    const affectedWindows = [];
    for (const windowId in windowActiveNotes) {
      if (windowActiveNotes[windowId] === noteIdToDelete) {
        affectedWindows.push(windowId);
        delete windowActiveNotes[windowId];
      }
    }

    await chrome.storage.local.set({ notes, windowActiveNotes });

    // If the deleted note was active in the current window, load a new one.
    if (activeNoteId === noteIdToDelete) {
      if (notes.length > 0) {
        // Find a new note to make active, preferably one not active in another window
        const otherActiveNotes = Object.values(windowActiveNotes);
        const newActiveNote = notes.find(n => !otherActiveNotes.includes(n.id)) || notes[0];
        await switchNote(newActiveNote.id);
      } else {
        await createNewNote(true);
      }
    }
    renderNoteList();
  }

  async function switchNote(noteId) {
    if (noteId === activeNoteId) return;
    await saveActiveNote();
    await loadNote(noteId);
  }

  // Enhanced keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N for new note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNewNote(false);
    }
    
    // Ctrl/Cmd + S for save (though auto-save is enabled)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveActiveNote();
    }
  });

  newNoteButton.addEventListener('click', () => createNewNote(false));

  // Add keyboard navigation for note list
  noteList.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const items = Array.from(noteList.querySelectorAll('li[data-note-id]'));
      const currentIndex = items.findIndex(item => item.classList.contains('active'));
      let newIndex;
      
      if (e.key === 'ArrowUp') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      } else {
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      }
      
      if (items[newIndex]) {
        const noteId = items[newIndex].dataset.noteId;
        switchNote(noteId);
      }
    }
  });

  initialize();
});
