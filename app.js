document.addEventListener("DOMContentLoaded", () => {
	let currentWindowId = null;

	// Create a wrapper for LinkTool to add paste handling
	class LinkToolWithPaste extends LinkTool {
		static get pasteConfig() {
			return {
				patterns: {
					// Match URLs starting with http(s)://
					http: /^https?:\/\//i,
				},
				tags: ['A']
			};
		}

		onPaste(event) {
			switch (event.type) {
				case 'pattern':
					// When a URL pattern is matched
					const url = event.detail.data;
					this.data = {
						link: url
					};
					break;
				case 'tag':
					// When an anchor tag is pasted
					const anchorTag = event.detail.data;
					this.data = {
						link: anchorTag.href || anchorTag.getAttribute('href')
					};
					break;
			}
		}
	}

	// Helper function to generate pin icon SVG
	function getPinIcon(isSolid = false) {
		if (isSolid) return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from MingCute Icon by MingCute Design - https://github.com/Richard9394/MingCute/blob/main/LICENSE --><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M8.867 2a2 2 0 0 0-1.98 1.717l-.515 3.605a9 9 0 0 1-1.71 4.128l-1.318 1.758c-.443.59-.265 1.525.528 1.82c.746.278 2.839.88 7.128.963V22a1 1 0 0 0 2 0v-6.01c4.29-.082 6.382-.684 7.128-.962c.793-.295.97-1.23.528-1.82l-1.319-1.758a9 9 0 0 1-1.71-4.128l-.514-3.605A2 2 0 0 0 15.133 2z"/></g></svg>`
		return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" fill-rule="evenodd"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M16.735 2.835a2 2 0 0 0-2.615-.186l-2.913 2.185a9 9 0 0 1-4.127 1.71l-2.177.31c-.73.105-1.265.891-.913 1.662c.331.723 1.385 2.629 4.36 5.72l-4.178 4.178a1 1 0 1 0 1.414 1.414l4.178-4.178c3.091 2.975 4.997 4.029 5.72 4.36c.77.352 1.557-.183 1.661-.913l.311-2.177a9 9 0 0 1 1.71-4.127L21.35 9.88a2 2 0 0 0-.186-2.615zM15.32 4.25l4.43 4.43l-2.184 2.914a11 11 0 0 0-2.09 5.044l-.143 1.001c-.98-.624-2.603-1.837-4.869-4.103C8.2 11.27 6.986 9.648 6.362 8.668l1-.143a11 11 0 0 0 5.045-2.09z"/></g></svg>`;
	}

	// Configuration for editor tools
	const editorTools = {
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
		linkTool: {
			class: LinkToolWithPaste,
			config: {
				endpoint: 'https://solitary-art-95e7.xijieyin.workers.dev',
			}
		},
		List: {
			class: EditorjsList,
			inlineToolbar: true,
			config: {
				defaultStyle: "unordered",
			},
		},
	};

	// Main editor instance
	const editor = new EditorJS({
		holder: "editorjs",
		autofocus: true,
		placeholder: "Start writing your note...",
		onChange: () => {
			saveActiveNote();
		},
		tools: editorTools,
	});

	// Pinned editor instance
	const pinnedEditor = new EditorJS({
		holder: "editorjs-pinned",
		placeholder: "Pinned note will appear here...",
		onChange: () => {
			savePinnedNote();
		},
		tools: editorTools,
	});

	const noteList = document.getElementById("note-list");
	const newNoteButton = document.getElementById("new-note");
	const pinnedEditorContainer = document.getElementById("pinned-editor");

	let notes = [];
	let activeNoteId = null;
	let pinnedNoteId = null;
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

			// Check if the pinned note was updated
			if (pinnedNoteId) {
				const currentPinnedNote = notes.find((n) => n.id === pinnedNoteId);
				const oldPinnedNote = oldNotes.find((n) => n.id === pinnedNoteId);

				if (
					currentPinnedNote &&
					oldPinnedNote &&
					JSON.stringify(currentPinnedNote.data) !== JSON.stringify(oldPinnedNote.data)
				) {
					// The pinned note was updated in another tab, reload it
					isUpdatingFromStorage = true;
					try {
						await pinnedEditor.isReady;
						if (currentPinnedNote.data && Object.keys(currentPinnedNote.data).length > 0) {
							await pinnedEditor.render(currentPinnedNote.data);
						} else {
							await pinnedEditor.clear();
						}
					} catch (error) {
						console.error("Error syncing pinned note from storage:", error);
					} finally {
						isUpdatingFromStorage = false;
					}
				}
			}

			// Check if a different note was pinned
			const newPinnedNote = notes.find((n) => n.pinned);
			if (newPinnedNote && newPinnedNote.id !== pinnedNoteId) {
				await loadPinnedNote(newPinnedNote.id);
			} else if (!newPinnedNote && pinnedNoteId) {
				await hidePinnedView();
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

		// Load pinned note if exists
		const pinnedNote = notes.find((n) => n.pinned);
		if (pinnedNote) {
			await loadPinnedNote(pinnedNote.id);
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
			pinBtn.innerHTML = getPinIcon(note.pinned);
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

	async function savePinnedNote() {
		if (!pinnedNoteId || isUpdatingFromStorage) return;

		try {
			isUpdatingFromStorage = true;
			const outputData = await pinnedEditor.save();
			const noteIndex = notes.findIndex((n) => n.id === pinnedNoteId);
			if (noteIndex !== -1) {
				notes[noteIndex].data = outputData;
				await chrome.storage.local.set({ notes });

				// Update the note title in the list with animation
				const li = noteList.querySelector(`[data-note-id="${pinnedNoteId}"]`);
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
			console.error("Error saving pinned note:", error);
		} finally {
			isUpdatingFromStorage = false;
		}
	}

	async function loadPinnedNote(noteId) {
		const note = notes.find((n) => n.id === noteId);
		if (note) {
			try {
				await pinnedEditor.isReady;
				if (note.data && Object.keys(note.data).length > 0) {
					await pinnedEditor.render(note.data);
				} else {
					await pinnedEditor.clear();
				}
				pinnedNoteId = noteId;
				showPinnedView();
			} catch (error) {
				console.error("Error loading pinned note:", error);
			}
		}
	}

	function showPinnedView() {
		pinnedEditorContainer.classList.add("active");
		pinnedEditorContainer.style.display = "flex";
	}

	async function hidePinnedView() {
		pinnedEditorContainer.classList.remove("active");
		pinnedEditorContainer.style.display = "none";
		pinnedNoteId = null;
		try {
			await pinnedEditor.isReady;
			await pinnedEditor.clear();
		} catch (error) {
			console.error("Error clearing pinned editor:", error);
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

			// Check if the deleted note is the pinned note
			const wasPinned = notes[noteIndex].pinned;

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

			// If this was the pinned note, hide the pinned view
			if (wasPinned && pinnedNoteId === noteId) {
				await hidePinnedView();
			}

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

			const currentPinStatus = notes[noteIndex].pinned;

			// If trying to pin a note
			if (!currentPinStatus) {
				// Unpin all other notes (only one pinned note allowed)
				notes.forEach((note, idx) => {
					if (idx !== noteIndex && note.pinned) {
						note.pinned = false;
					}
				});

				// Pin the selected note
				notes[noteIndex].pinned = true;

				await chrome.storage.local.set({ notes });
				renderNoteList();

				// Load the pinned note in the right editor
				await loadPinnedNote(noteId);
			} else {
				// Unpin the note
				notes[noteIndex].pinned = false;

				await chrome.storage.local.set({ notes });
				renderNoteList();

				// Hide the pinned view
				await hidePinnedView();
			}
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
