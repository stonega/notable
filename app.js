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

	function getMarkdownIcon() {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><g fill="none"><path fill="currentColor" d="m15.393 4.054l-.502.557zm3.959 3.563l-.502.557zm2.302 2.537l-.685.305zM3.172 20.828l.53-.53zm17.656 0l-.53-.53zM14 21.25h-4v1.5h4zM2.75 14v-4h-1.5v4zm18.5-.437V14h1.5v-.437zM14.891 4.61l3.959 3.563l1.003-1.115l-3.958-3.563zm7.859 8.952c0-1.689.015-2.758-.41-3.714l-1.371.61c.266.598.281 1.283.281 3.104zm-3.9-5.389c1.353 1.218 1.853 1.688 2.119 2.285l1.37-.61c-.426-.957-1.23-1.66-2.486-2.79zM10.03 2.75c1.582 0 2.179.012 2.71.216l.538-1.4c-.852-.328-1.78-.316-3.248-.316zm5.865.746c-1.086-.977-1.765-1.604-2.617-1.93l-.537 1.4c.532.204.98.592 2.15 1.645zM10 21.25c-1.907 0-3.261-.002-4.29-.14c-1.005-.135-1.585-.389-2.008-.812l-1.06 1.06c.748.75 1.697 1.081 2.869 1.239c1.15.155 2.625.153 4.489.153zM1.25 14c0 1.864-.002 3.338.153 4.489c.158 1.172.49 2.121 1.238 2.87l1.06-1.06c-.422-.424-.676-1.004-.811-2.01c-.138-1.027-.14-2.382-.14-4.289zM14 22.75c1.864 0 3.338.002 4.489-.153c1.172-.158 2.121-.49 2.87-1.238l-1.06-1.06c-.424.422-1.004.676-2.01.811c-1.027.138-2.382.14-4.289.14zM21.25 14c0 1.907-.002 3.262-.14 4.29c-.135 1.005-.389 1.585-.812 2.008l1.06 1.06c.75-.748 1.081-1.697 1.239-2.869c.155-1.15.153-2.625.153-4.489zm-18.5-4c0-1.907.002-3.261.14-4.29c.135-1.005.389-1.585.812-2.008l-1.06-1.06c-.75.748-1.081 1.697-1.239 2.869C1.248 6.661 1.25 8.136 1.25 10zm7.28-8.75c-1.875 0-3.356-.002-4.511.153c-1.177.158-2.129.49-2.878 1.238l1.06 1.06c.424-.422 1.005-.676 2.017-.811c1.033-.138 2.395-.14 4.312-.14z"/><path stroke="currentColor" stroke-width="1.5" d="M13 2.5V5c0 2.357 0 3.536.732 4.268S15.643 10 18 10h4"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8.5 13.5v5m0 0l2-1.875m-2 1.875l-2-1.875"/></g></svg>`
	}
	function getCopyIcon() {
		return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Solar by 480 Design - https://creativecommons.org/licenses/by/4.0/ --><path fill="currentColor" fill-rule="evenodd" d="M15 1.25h-4.056c-1.838 0-3.294 0-4.433.153c-1.172.158-2.121.49-2.87 1.238c-.748.749-1.08 1.698-1.238 2.87c-.153 1.14-.153 2.595-.153 4.433V16a3.75 3.75 0 0 0 3.166 3.705c.137.764.402 1.416.932 1.947c.602.602 1.36.86 2.26.982c.867.116 1.97.116 3.337.116h3.11c1.367 0 2.47 0 3.337-.116c.9-.122 1.658-.38 2.26-.982s.86-1.36.982-2.26c.116-.867.116-1.97.116-3.337v-5.11c0-1.367 0-2.47-.116-3.337c-.122-.9-.38-1.658-.982-2.26c-.531-.53-1.183-.795-1.947-.932A3.75 3.75 0 0 0 15 1.25m2.13 3.021A2.25 2.25 0 0 0 15 2.75h-4c-1.907 0-3.261.002-4.29.14c-1.005.135-1.585.389-2.008.812S4.025 4.705 3.89 5.71c-.138 1.029-.14 2.383-.14 4.29v6a2.25 2.25 0 0 0 1.521 2.13c-.021-.61-.021-1.3-.021-2.075v-5.11c0-1.367 0-2.47.117-3.337c.12-.9.38-1.658.981-2.26c.602-.602 1.36-.86 2.26-.981c.867-.117 1.97-.117 3.337-.117h3.11c.775 0 1.464 0 2.074.021M7.408 6.41c.277-.277.665-.457 1.4-.556c.754-.101 1.756-.103 3.191-.103h3c1.435 0 2.436.002 3.192.103c.734.099 1.122.28 1.399.556c.277.277.457.665.556 1.4c.101.754.103 1.756.103 3.191v5c0 1.435-.002 2.436-.103 3.192c-.099.734-.28 1.122-.556 1.399c-.277.277-.665.457-1.4.556c-.755.101-1.756.103-3.191.103h-3c-1.435 0-2.437-.002-3.192-.103c-.734-.099-1.122-.28-1.399-.556c-.277-.277-.457-.665-.556-1.4c-.101-.755-.103-1.756-.103-3.191v-5c0-1.435.002-2.437.103-3.192c.099-.734.28-1.122.556-1.399" clip-rule="evenodd"/></svg>`
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
		placeholder: "Type / to add...",
		onChange: () => {
			saveActiveNote();
		},
		tools: editorTools,
	});

	// Pinned editor instance
	const pinnedEditor = new EditorJS({
		holder: "editorjs-pinned",
		placeholder: "Type / to add...",
		onChange: () => {
			savePinnedNote();
		},
		tools: editorTools,
	});

	const noteList = document.getElementById("note-list");
	const newNoteButton = document.getElementById("new-note");
	const pinnedEditorContainer = document.getElementById("pinned-editor");
	const copyMarkdownBtn = document.getElementById("copy-markdown");
	const downloadMarkdownBtn = document.getElementById("download-markdown");
	const togglePinBtn = document.getElementById("toggle-pin");
	const copyMarkdownPinnedBtn = document.getElementById("copy-markdown-pinned");
	const downloadMarkdownPinnedBtn = document.getElementById("download-markdown-pinned");
	const togglePinPinnedBtn = document.getElementById("toggle-pin-pinned");

	let notes = [];
	let activeNoteId = null;
	let pinnedNoteId = null;
	let isUpdatingFromStorage = false; // Flag to prevent infinite loops

	// Convert EditorJS data to Markdown
	function convertToMarkdown(data) {
		if (!data || !data.blocks) return '';
		
		return data.blocks.map(block => {
			switch (block.type) {
				case 'header':
					const level = '#'.repeat(block.data.level || 2);
					return `${level} ${block.data.text.replace(/<[^>]*>/g, '')}\n`;
				case 'paragraph':
					return `${block.data.text.replace(/<[^>]*>/g, '')}\n`;
				case 'list':
					const items = block.data.items.map((item, index) => {
						const cleanText = item.replace(/<[^>]*>/g, '');
						if (block.data.style === 'ordered') {
							return `${index + 1}. ${cleanText}`;
						}
						return `- ${cleanText}`;
					}).join('\n');
					return `${items}\n`;
				case 'checklist':
					const checkItems = block.data.items.map(item => {
						const checked = item.checked ? 'x' : ' ';
						const cleanText = item.text.replace(/<[^>]*>/g, '');
						return `- [${checked}] ${cleanText}`;
					}).join('\n');
					return `${checkItems}\n`;
				case 'quote':
					const quoteText = block.data.text.replace(/<[^>]*>/g, '');
					const caption = block.data.caption ? `\n*${block.data.caption.replace(/<[^>]*>/g, '')}*` : '';
					return `> ${quoteText}${caption}\n`;
				case 'code':
					return `\`\`\`\n${block.data.code}\n\`\`\`\n`;
				case 'image':
					return `![](${block.data.url})\n`;
				case 'linkTool':
					const title = block.data.meta?.title || block.data.link;
					const description = block.data.meta?.description ? `\n${block.data.meta.description}` : '';
					return `[${title}](${block.data.link})${description}\n`;
				default:
					return '';
			}
		}).join('\n');
	}

	// Copy markdown to clipboard
	async function copyMarkdown(editorInstance) {
		try {
			const outputData = await editorInstance.save();
			const markdown = convertToMarkdown(outputData);
			await navigator.clipboard.writeText(markdown);
			
			// Show feedback
			const btn = editorInstance === editor ? copyMarkdownBtn : copyMarkdownPinnedBtn;
			const originalHTML = btn.innerHTML;
			btn.innerHTML = '<span style="font-size: 14px;">✓</span>';
			btn.style.color = 'var(--success-color)';
			
			setTimeout(() => {
				btn.innerHTML = originalHTML;
				btn.style.color = '';
			}, 1500);
		} catch (error) {
			console.error('Error copying markdown:', error);
		}
	}

	// Download markdown as file
	async function downloadMarkdown(editorInstance, noteId) {
		try {
			const outputData = await editorInstance.save();
			const markdown = convertToMarkdown(outputData);
			
			// Get note title for filename
			const note = notes.find(n => n.id === noteId);
			let filename = 'note.md';
			if (note) {
				const noteTitle = getNoteTitle(note);
				// Clean filename - replace invalid characters
				filename = noteTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
			}
			
			// Create blob and download
			const blob = new Blob([markdown], { type: 'text/markdown' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			// Show feedback
			const btn = editorInstance === editor ? downloadMarkdownBtn : downloadMarkdownPinnedBtn;
			const originalHTML = btn.innerHTML;
			btn.innerHTML = '<span style="font-size: 14px;">✓</span>';
			btn.style.color = 'var(--success-color)';
			
			setTimeout(() => {
				btn.innerHTML = originalHTML;
				btn.style.color = '';
			}, 1500);
		} catch (error) {
			console.error('Error downloading markdown:', error);
		}
	}

	// Update pin button state
	function updatePinButton(button, isPinned) {
		button.innerHTML = getPinIcon(isPinned);
		if (isPinned) {
			button.classList.add('pinned');
			button.setAttribute('aria-label', 'Unpin note');
			button.setAttribute('title', 'Unpin note');
		} else {
			button.classList.remove('pinned');
			button.setAttribute('aria-label', 'Pin note');
			button.setAttribute('title', 'Pin note');
		}
	}

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
			// Only show split view if the pinned note is not the active note
			if (newPinnedNote.id !== activeNoteId) {
				await loadPinnedNote(newPinnedNote.id);
			} else {
				// If the pinned note is the active note, just hide the split view
				await hidePinnedView();
			}
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

		// Load pinned note if exists and it's not the active note
		const pinnedNote = notes.find((n) => n.pinned);
		if (pinnedNote && pinnedNote.id !== activeNoteId) {
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

				// Update pin button state
				updatePinButton(togglePinBtn, note.pinned);

				// If the active note is the same as the pinned note, hide the split view
				if (pinnedNoteId === noteId) {
					await hidePinnedView();
				}

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
		// Don't load in split view if it's the same as the active note
		if (noteId === activeNoteId) {
			await hidePinnedView();
			return;
		}
		
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
				
				// Update pin button state (always solid for pinned editor)
				updatePinButton(togglePinPinnedBtn, true);
				
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
		
		// Check if there's a pinned note
		const pinnedNote = notes.find((n) => n.pinned);
		const oldActiveNoteId = activeNoteId;
		
		await loadNote(noteId);
		
		// Update pin button state for the newly loaded note
		const note = notes.find((n) => n.id === noteId);
		if (note) {
			updatePinButton(togglePinBtn, note.pinned);
		}
		
		// Handle split view based on pinned note
		if (pinnedNote) {
			if (pinnedNote.id === noteId) {
				// Switching TO a pinned note - hide split view
				await hidePinnedView();
			} else if (pinnedNote.id === oldActiveNoteId) {
				// Switching FROM a pinned note - show it in split view
				await loadPinnedNote(pinnedNote.id);
			}
		}
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

		// Update main editor pin button if this is the active note
		if (noteId === activeNoteId) {
			updatePinButton(togglePinBtn, true);
			// Close split view when pinning the active note
			await hidePinnedView();
		} else {
			// Load the pinned note in the right editor (split view)
			await loadPinnedNote(noteId);
		}
		} else {
				// Unpin the note
				notes[noteIndex].pinned = false;

				await chrome.storage.local.set({ notes });
				renderNoteList();

				// Update main editor pin button if this is the active note
				if (noteId === activeNoteId) {
					updatePinButton(togglePinBtn, false);
				}

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

		// Ctrl/Cmd + E for copy markdown to clipboard
		if ((e.ctrlKey || e.metaKey) && e.key === "e") {
			e.preventDefault();
			copyMarkdown(editor);
		}

		// Ctrl/Cmd + D for download markdown file
		if ((e.ctrlKey || e.metaKey) && e.key === "d") {
			e.preventDefault();
			if (activeNoteId) {
				downloadMarkdown(editor, activeNoteId);
			}
		}
	});

	newNoteButton.addEventListener("click", () => createNewNote(true));

	// Add action bar event listeners
	copyMarkdownBtn.addEventListener("click", () => copyMarkdown(editor));
	copyMarkdownPinnedBtn.addEventListener("click", () => copyMarkdown(pinnedEditor));
	
	downloadMarkdownBtn.addEventListener("click", () => {
		if (activeNoteId) {
			downloadMarkdown(editor, activeNoteId);
		}
	});
	
	downloadMarkdownPinnedBtn.addEventListener("click", () => {
		if (pinnedNoteId) {
			downloadMarkdown(pinnedEditor, pinnedNoteId);
		}
	});
	
	togglePinBtn.addEventListener("click", () => {
		if (activeNoteId) {
			togglePinNote(activeNoteId);
		}
	});
	
	togglePinPinnedBtn.addEventListener("click", () => {
		if (pinnedNoteId) {
			togglePinNote(pinnedNoteId);
		}
	});

	// Initialize action bar icons
	copyMarkdownBtn.innerHTML = getCopyIcon();
	copyMarkdownPinnedBtn.innerHTML = getCopyIcon();
	downloadMarkdownBtn.innerHTML = getMarkdownIcon();
	downloadMarkdownPinnedBtn.innerHTML = getMarkdownIcon();
	togglePinBtn.innerHTML = getPinIcon(false);
	togglePinPinnedBtn.innerHTML = getPinIcon(true);

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
