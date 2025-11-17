document.addEventListener("DOMContentLoaded", () => {
	let currentWindowId = null;

	const editor = new EditorJS({
		holder: "editorjs",
		autofocus: true,
		placeholder: "Start writing your note...",
		onChange: () => {
			saveActiveNote();
		},
		tools: {
			header: {
				class: Header,
				config: {
					placeholder: "Enter a header",
					levels: [2, 3, 4],
					defaultLevel: 3,
				},
			},
			code: CodeTool,
			quote: Quote,
			paragraph: {
				class: Paragraph,
				inlineToolbar: true,
			},
			image: SimpleImage,
			checklist: {
				class: Checklist,
				inlineToolbar: true,
			},
			List: {
				class: EditorjsList,
				inlineToolbar: true,
				config: {
					defaultStyle: "unordered",
				},
			},
		},
	});

	const noteList = document.getElementById("note-list");
	const newNoteButton = document.getElementById("new-note");

	let notes = [];
	let activeNoteId = null;
	let isUpdatingFromStorage = false; // Flag to prevent infinite loops

	// Add storage change listener for instant sync
	chrome.storage.onChanged.addListener((changes, namespace) => {
		if (namespace === "local" && !isUpdatingFromStorage) {
			handleStorageChanges(changes);
		}
	});

	async function handleStorageChanges(changes) {
		if (changes.notes) {
			// Notes were updated in another tab
			const oldNotes = notes;
			notes = changes.notes.newValue || [];

			// Check if the current active note was updated
			if (activeNoteId) {
				const currentNote = notes.find((n) => n.id === activeNoteId);
				const oldNote = oldNotes.find((n) => n.id === activeNoteId);

				if (
					currentNote &&
					oldNote &&
					JSON.stringify(currentNote.data) !== JSON.stringify(oldNote.data)
				) {
					// The active note was updated in another tab, reload it
					isUpdatingFromStorage = true;
					try {
						await editor.isReady;
						if (currentNote.data && Object.keys(currentNote.data).length > 0) {
							await editor.render(currentNote.data);
						} else {
							await editor.clear();
						}
					} catch (error) {
						console.error("Error syncing note from storage:", error);
					} finally {
						isUpdatingFromStorage = false;
					}
				}
			}

			// Always update the note list to reflect changes
			renderNoteList();
		}

		if (changes.windowActiveNotes) {
			// Window active notes were updated, but we don't need to do anything
			// as this is per-window state
		}
	}

	async function initialize() {
		const window = await chrome.windows.getCurrent();
		currentWindowId = window.id;

		const data = await chrome.storage.local.get(["notes", "windowActiveNotes"]);
		notes = data.notes || [];

		// Ensure backward compatibility: add pinned property to existing notes
		let needsUpdate = false;
		notes = notes.map(note => {
			if (note.pinned === undefined) {
				needsUpdate = true;
				return { ...note, pinned: false };
			}
			return note;
		});

		// Save updated notes if migration was needed
		if (needsUpdate) {
			await chrome.storage.local.set({ notes });
		}

		const windowActiveNotes = data.windowActiveNotes || {};
		activeNoteId = windowActiveNotes[currentWindowId];

		if (activeNoteId && notes.find((n) => n.id === activeNoteId)) {
			await loadNote(activeNoteId);
		} else if (notes.length > 0) {
			// Load the first available note instead of creating a new one
			await loadNote(notes[0].id);
		} else {
			// Only create a new note if no notes exist at all
			await createNewNote(true);
		}

		renderNoteList();

		// Add fade-in animation to the app
		document.body.classList.add("fade-in");
	}

	function renderNoteList() {
		// Renders all notes, highlights the one active in this window
		noteList.innerHTML = "";

		if (notes.length === 0) {
			const emptyState = document.createElement("li");
			emptyState.className = "empty-state";
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

		// Sort notes: pinned notes first, then by creation date (newest first)
		const sortedNotes = [...notes].sort((a, b) => {
			if (a.pinned && !b.pinned) return -1;
			if (!a.pinned && b.pinned) return 1;
			return new Date(b.createdAt) - new Date(a.createdAt);
		});

		sortedNotes.forEach((note, index) => {
			const li = document.createElement("li");
			const noteTitle = getNoteTitle(note);

			li.className = note.id === activeNoteId ? "active" : "";
			li.dataset.noteId = note.id;
			li.setAttribute("role", "listitem");
			li.setAttribute("tabindex", "0");
			li.setAttribute("aria-label", `Note: ${noteTitle}`);

			// Create note title element
			const titleElement = document.createElement("div");
			titleElement.className = "note-title";
			titleElement.textContent = noteTitle;

			// Create actions container
			const actionsContainer = document.createElement("div");
			actionsContainer.className = "note-actions";

			// Create pin button
			const pinBtn = document.createElement("button");
			pinBtn.innerHTML = note.pinned ? "📌" : "📍";
			pinBtn.className = `pin-note ${note.pinned ? "pinned" : ""}`;
			pinBtn.setAttribute("aria-label", note.pinned ? `Unpin note: ${noteTitle}` : `Pin note: ${noteTitle}`);
			pinBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				togglePinNote(note.id);
			});

			// Create delete button
			const deleteBtn = document.createElement("button");
			deleteBtn.innerHTML = "×";
			deleteBtn.className = "delete-note";
			deleteBtn.setAttribute("aria-label", `Delete note: ${noteTitle}`);
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				deleteNote(note.id);
			});

			actionsContainer.appendChild(pinBtn);
			actionsContainer.appendChild(deleteBtn);

			li.appendChild(titleElement);
			li.appendChild(actionsContainer);

			// Add pinned class if note is pinned
			if (note.pinned) {
				li.classList.add("pinned");
			}

			// Add click and keyboard event listeners
			li.addEventListener("click", () => switchNote(note.id));
			li.addEventListener("keydown", (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					switchNote(note.id);
				}
			});

			noteList.appendChild(li);
		});
	}

	function getNoteTitle(note) {
		if (note.data && note.data.blocks && note.data.blocks.length > 0) {
			const firstBlock = note.data.blocks[0];
			if (
				(firstBlock.type === "header" || firstBlock.type === "paragraph") &&
				firstBlock.data.text
			) {
				// Strip HTML tags and get clean text
				const cleanText = firstBlock.data.text.replace(/<[^>]*>/g, "").trim();
				return cleanText.substring(0, 30) || "Untitled Note";
			}
		}
		return "Untitled Note";
	}

	async function loadNote(noteId) {
		const note = notes.find((n) => n.id === noteId);
		if (note) {
			// Add loading state
			const editorContainer = document.getElementById("editorjs");
			editorContainer.classList.add("loading");

			try {
				await editor.isReady;
				if (note.data && Object.keys(note.data).length > 0) {
					await editor.render(note.data);
				} else {
					await editor.clear();
				}
				activeNoteId = noteId;

				const data = await chrome.storage.local.get("windowActiveNotes");
				const windowActiveNotes = data.windowActiveNotes || {};
				windowActiveNotes[currentWindowId] = activeNoteId;
				await chrome.storage.local.set({ windowActiveNotes });

				renderNoteList();
			} catch (error) {
				console.error("Error loading note:", error);
			} finally {
				// Remove loading state
				editorContainer.classList.remove("loading");
			}
		}
	}

	async function saveActiveNote() {
		if (!activeNoteId || isUpdatingFromStorage) return;

		try {
			isUpdatingFromStorage = true;
			const outputData = await editor.save();
			const noteIndex = notes.findIndex((n) => n.id === activeNoteId);
			if (noteIndex !== -1) {
				notes[noteIndex].data = outputData;
				await chrome.storage.local.set({ notes });

				// Update the note title in the list with animation
				const li = noteList.querySelector(`[data-note-id="${activeNoteId}"]`);
				if (li) {
					const titleElement = li.querySelector(".note-title");
					if (titleElement) {
						const newTitle = getNoteTitle(notes[noteIndex]);
						if (titleElement.textContent !== newTitle) {
							titleElement.style.opacity = "0.5";
							setTimeout(() => {
								titleElement.textContent = newTitle;
								titleElement.style.opacity = "1";
							}, 150);
						}
					}
				}
			}
		} catch (error) {
			console.error("Error saving note:", error);
		} finally {
			isUpdatingFromStorage = false;
		}
	}

	async function createNewNote(setAsActive = false) {
		if (isUpdatingFromStorage) return;

		isUpdatingFromStorage = true;
		try {
			const newNote = {
				id: Date.now().toString(),
				data: {},
				createdAt: new Date().toISOString(),
				pinned: false,
			};

			notes.unshift(newNote);

			const windowActiveNotes = setAsActive
				? {
						...((await chrome.storage.local.get("windowActiveNotes"))
							.windowActiveNotes || {}),
						[currentWindowId]: newNote.id,
					}
				: (await chrome.storage.local.get("windowActiveNotes"))
						.windowActiveNotes || {};

			await chrome.storage.local.set({ notes, windowActiveNotes });

			if (setAsActive) {
				activeNoteId = newNote.id;
				await loadNote(activeNoteId);
			}

			renderNoteList();
		} finally {
			isUpdatingFromStorage = false;
		}
	}

	async function deleteNote(noteId) {
		if (isUpdatingFromStorage) return;

		isUpdatingFromStorage = true;
		try {
			const noteIndex = notes.findIndex((n) => n.id === noteId);
			if (noteIndex === -1) return;

			// Remove the note
			notes.splice(noteIndex, 1);

			// Clean up windowActiveNotes for all windows that had this note active
			const data = await chrome.storage.local.get("windowActiveNotes");
			const windowActiveNotes = data.windowActiveNotes || {};

			Object.keys(windowActiveNotes).forEach((windowId) => {
				if (windowActiveNotes[windowId] === noteId) {
					delete windowActiveNotes[windowId];
				}
			});

			await chrome.storage.local.set({ notes, windowActiveNotes });

			// If this was the active note in current window, create a new one
			if (activeNoteId === noteId) {
				if (notes.length > 0) {
					await loadNote(notes[0].id);
				} else {
					await createNewNote(true);
				}
			}

			renderNoteList();
		} finally {
			isUpdatingFromStorage = false;
		}
	}

	async function switchNote(noteId) {
		if (noteId === activeNoteId) return;
		await saveActiveNote();
		await loadNote(noteId);
	}

	async function togglePinNote(noteId) {
		if (isUpdatingFromStorage) return;

		isUpdatingFromStorage = true;
		try {
			const noteIndex = notes.findIndex((n) => n.id === noteId);
			if (noteIndex === -1) return;

			// Toggle the pinned status
			notes[noteIndex].pinned = !notes[noteIndex].pinned;

			await chrome.storage.local.set({ notes });
			renderNoteList();
		} catch (error) {
			console.error("Error toggling pin status:", error);
		} finally {
			isUpdatingFromStorage = false;
		}
	}

	// Enhanced keyboard shortcuts
	document.addEventListener("keydown", (e) => {
		// Ctrl/Cmd + N for new note
		if ((e.ctrlKey || e.metaKey) && e.key === "n") {
			e.preventDefault();
			createNewNote(false);
		}

		// Ctrl/Cmd + S for save (though auto-save is enabled)
		if ((e.ctrlKey || e.metaKey) && e.key === "s") {
			e.preventDefault();
			saveActiveNote();
		}

		// Ctrl/Cmd + P for pin/unpin active note
		if ((e.ctrlKey || e.metaKey) && e.key === "p") {
			e.preventDefault();
			if (activeNoteId) {
				togglePinNote(activeNoteId);
			}
		}
	});

	newNoteButton.addEventListener("click", () => createNewNote(true));

	// Add keyboard navigation for note list
	noteList.addEventListener("keydown", (e) => {
		if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			e.preventDefault();
			const items = Array.from(noteList.querySelectorAll("li[data-note-id]"));
			const currentIndex = items.findIndex((item) =>
				item.classList.contains("active"),
			);
			let newIndex;

			if (e.key === "ArrowUp") {
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
