const lightBase = {
    "bg-secondary": "#fafafa",
    "bg-tertiary": "#f0f0f0",
    "bg-hover": "#f8f8f8",
    "text-primary": "#000000",
    "text-secondary": "#666666",
    "text-muted": "#999999",
    "text-inverse": "#ffffff",
    "border-color": "#f5f5f5",
    "border-hover": "#d0d0d0"
};

const darkBase = {
    "bg-primary": "#1a1a1a",
    "bg-secondary": "#242424",
    "bg-tertiary": "#2d2d2d",
    "bg-hover": "#333333",
    "text-primary": "#e5e5e5",
    "text-secondary": "#a3a3a3",
    "text-muted": "#737373",
    "text-inverse": "#1a1a1a",
    "border-color": "#2d2d2d",
    "border-hover": "#404040"
};

const lightThemes = [
    // Row 1
    { ...lightBase, name: "Blue", "bg-primary": "#dbe9fa", "primary-color": "#4c8df6", "primary-hover": "#1a6ef3", "primary-light": "#7cacf8" },
    { ...lightBase, name: "Dark Blue", "bg-primary": "#dbe9fa", "primary-color": "#0052cc", "primary-hover": "#0041a3", "primary-light": "#3372d8" },
    { ...lightBase, name: "Steel Blue", "bg-primary": "#d5e0f0", "primary-color": "#4a698c", "primary-hover": "#3b5470", "primary-light": "#6b87a9" },
    { ...lightBase, name: "Slate Gray", "bg-primary": "#ced8e6", "primary-color": "#6c7a8b", "primary-hover": "#566270", "primary-light": "#8b96a6" },
    // Row 2
    { ...lightBase, name: "Teal", "bg-primary": "#d7f0ee", "primary-color": "#00838f", "primary-hover": "#006974", "primary-light": "#339fa9" },
    { ...lightBase, name: "Green", "bg-primary": "#e1f3e1", "primary-color": "#2e7d32", "primary-hover": "#246328", "primary-light": "#57975a" },
    { ...lightBase, name: "Light Green", "bg-primary": "#e9f5e9", "primary-color": "#558b2f", "primary-hover": "#447026", "primary-light": "#77a358" },
    { ...lightBase, name: "Lime", "bg-primary": "#f3f6e0", "primary-color": "#9e9d24", "primary-hover": "#7e7d1d", "primary-light": "#b2b14f" },
    // Row 3
    { ...lightBase, name: "Orange", "bg-primary": "#fef3e3", "primary-color": "#ef6c00", "primary-hover": "#bf5600", "primary-light": "#ff8c33" },
    { ...lightBase, name: "Deep Orange", "bg-primary": "#fbebe8", "primary-color": "#d84315", "primary-hover": "#ac3611", "primary-light": "#e46840" },
    { ...lightBase, name: "Pink", "bg-primary": "#fce6eb", "primary-color": "#c2185b", "primary-hover": "#9b1349", "primary-light": "#d5457c" },
    { ...lightBase, name: "Purple", "bg-primary": "#f8e9f2", "primary-color": "#8e24aa", "primary-hover": "#711d88", "primary-light": "#a64fc2" },
    // Row 4
    { ...lightBase, name: "Deep Purple", "bg-primary": "#f3eef8", "primary-color": "#5e35b1", "primary-hover": "#4b2a8e", "primary-light": "#7e57c2" },
    { ...lightBase, name: "Indigo", "bg-primary": "#eceef6", "primary-color": "#3949ab", "primary-hover": "#2d3a89", "primary-light": "#5f6fc0" },
    { ...lightBase, name: "Bright Blue", "bg-primary": "#e9f2fc", "primary-color": "#1e88e5", "primary-hover": "#186db7", "primary-light": "#4ca0ec" }
];

const darkThemes = [
    // Row 1
    { ...darkBase, name: "Blue", "bg-primary": "#0d1f33", "primary-color": "#99c2ff", "primary-hover": "#66a3ff", "primary-light": "#cce0ff" },
    { ...darkBase, name: "Gray", "bg-primary": "#262626", "primary-color": "#b3b3b3", "primary-hover": "#999999", "primary-light": "#cccccc" },
    { ...darkBase, name: "Dark Blue", "bg-primary": "#1a2d45", "primary-color": "#adbeff", "primary-hover": "#8a9eff", "primary-light": "#d1d8ff" },
    { ...darkBase, name: "Slate", "bg-primary": "#2a323d", "primary-color": "#b8c5d6", "primary-hover": "#94a3b8", "primary-light": "#dce1e8" },
    // Row 2
    { ...darkBase, name: "Dark Teal", "bg-primary": "#1f2d2d", "primary-color": "#99d6e0", "primary-hover": "#66c3d1", "primary-light": "#ccebf0" },
    { ...darkBase, name: "Cyan", "bg-primary": "#1a2e35", "primary-color": "#99f6e4", "primary-hover": "#66f2d9", "primary-light": "#ccfbf2" },
    { ...darkBase, name: "Dark Green", "bg-primary": "#1f2d24", "primary-color": "#b3ffb3", "primary-hover": "#80ff80", "primary-light": "#d9ffd9" },
    { ...darkBase, name: "Olive", "bg-primary": "#262922", "primary-color": "#d9e0a3", "primary-hover": "#c4cc8a", "primary-light": "#e8ebc7" },
    // Row 3
    { ...darkBase, name: "Brown", "bg-primary": "#29241e", "primary-color": "#ffcc99", "primary-hover": "#ffbf66", "primary-light": "#ffe6cc" },
    { ...darkBase, name: "Terracotta", "bg-primary": "#332422", "primary-color": "#ffc2b3", "primary-hover": "#ffa38a", "primary-light": "#ffe0d9" },
    { ...darkBase, name: "Dark Brown", "bg-primary": "#332424", "primary-color": "#ffb3b3", "primary-hover": "#ff8080", "primary-light": "#ffd9d9" },
    { ...darkBase, name: "Rose", "bg-primary": "#33222d", "primary-color": "#ffb3e1", "primary-hover": "#ff8ad4", "primary-light": "#ffd9f0" },
    // Row 4
    { ...darkBase, name: "Mauve", "bg-primary": "#302433", "primary-color": "#f0b3ff", "primary-hover": "#e680ff", "primary-light": "#f5d9ff" },
    { ...darkBase, name: "Purple", "bg-primary": "#2b2433", "primary-color": "#d1b3ff", "primary-hover": "#b88aff", "primary-light": "#e8d9ff" },
    { ...darkBase, name: "Indigo", "bg-primary": "#242633", "primary-color": "#b3bfff", "primary-hover": "#8a9eff", "primary-light": "#d9dfff" }
];

window.lightThemes = lightThemes;
window.darkThemes = darkThemes;

function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(`--${property}`, value);
    });
}

window.applyTheme = applyTheme;

// Immediately fetch and apply theme
chrome.storage.local.get(["currentTheme"], (result) => {
    if (result.currentTheme) {
        applyTheme(result.currentTheme);
    }
    
    // Show body once theme is applied
    if (document.body) {
        document.body.classList.add('loaded');
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('loaded');
        });
    }
});
