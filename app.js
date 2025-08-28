document.addEventListener('DOMContentLoaded', () => {
    let currentWindowId = null;

    const editor = new EditorJS({
        holder: 'editorjs',
        autofocus: true,
        onChange: () => {
            saveActiveNote();
        },
        tools: {
            header: { class: 'Header', inlineToolbar: ['link'] },
            list: { class: 'List', inlineToolbar: true }
        },
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
    }

    function renderNoteList() {
        // Renders all notes, highlights the one active in this window
        noteList.innerHTML = '';
        notes.forEach(note => {
            const li = document.createElement('li');
            const noteTitle = getNoteTitle(note);
            li.textContent = noteTitle;
            li.dataset.noteId = note.id;
            li.className = note.id === activeNoteId ? 'active' : '';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.className = 'delete-note';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });

            li.appendChild(deleteBtn);
            li.addEventListener('click', () => switchNote(note.id));
            noteList.appendChild(li);
        });
    }

    function getNoteTitle(note) {
        if (note.data && note.data.blocks && note.data.blocks.length > 0) {
            const firstBlock = note.data.blocks[0];
            if ((firstBlock.type === 'header' || firstBlock.type === 'paragraph') && firstBlock.data.text) {
                return firstBlock.data.text.substring(0, 20) || 'Untitled Note';
            }
        }
        return 'Untitled Note';
    }

    async function loadNote(noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            await editor.isReady;
            if (note.data && Object.keys(note.data).length > 0) {
                editor.render(note.data);
            } else {
                editor.clear();
            }
            activeNoteId = noteId;

            const data = await chrome.storage.local.get('windowActiveNotes');
            const windowActiveNotes = data.windowActiveNotes || {};
            windowActiveNotes[currentWindowId] = activeNoteId;
            await chrome.storage.local.set({ windowActiveNotes });

            renderNoteList();
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

                const li = noteList.querySelector(`[data-note-id="${activeNoteId}"]`);
                if(li && li.firstChild) {
                   li.firstChild.textContent = getNoteTitle(notes[noteIndex]);
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
        };
        notes.unshift(newNote);
        activeNoteId = newNote.id;

        const data = await chrome.storage.local.get('windowActiveNotes');
        const windowActiveNotes = data.windowActiveNotes || {};
        windowActiveNotes[currentWindowId] = activeNoteId;

        await chrome.storage.local.set({ notes, windowActiveNotes });

        await loadNote(activeNoteId);
        renderNoteList();
    }

    async function deleteNote(noteIdToDelete) {
        notes = notes.filter(n => n.id !== noteIdToDelete);

        // Find which windows were pointing to this note
        const data = await chrome.storage.local.get('windowActiveNotes');
        const windowActiveNotes = data.windowActiveNotes || {};
        const affectedWindows = [];
        for(const windowId in windowActiveNotes){
            if(windowActiveNotes[windowId] === noteIdToDelete){
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

    newNoteButton.addEventListener('click', () => createNewNote(false));

    initialize();
});
