---
title: "Practical Vim Guide for Linux Administration"
description: "Essential Vim motions, text objects, Visual Block editing, search and replace, tab indentation, and a clean server-ready .vimrc for editing config files over SSH."
date: 2026-11-27
category: linux
tags: [vim, linux, cli, sysadmin, tips]
draft: false
---

When you SSH into a minimal Linux server, container, or rescue shell, GUI editors are not there, and `nano` quickly runs out of steam on multi-hundred-line NGINX, systemd, YAML, or SSH configurations. Vim is installed almost everywhere, starts instantly, and lets you edit structured config files with surgical precision once you internalize a small set of core commands.

This guide expands my personal Vim cheat sheet into a practical day-to-day reference for Linux administration.

## 1. Modes and Saving Files

Vim is modal: keys behave differently depending on the active mode. Press `Esc` (or `Ctrl+[`) at any time to return to **Normal** mode.

| Mode | How to Enter | Purpose |
| :--- | :--- | :--- |
| **Normal** | `Esc` | Navigate, delete, yank, paste, and run operators |
| **Insert** | `i`, `a`, `o`, `O`, `I`, `A` | Type text directly into the buffer |
| **Visual** | `v` (char), `V` (line), `Ctrl+v` (block) | Select text before applying an action |
| **Command-line** | `:`, `/`, `?` | Run Ex commands, save/quit, search and replace |

Common save and exit commands in Command-line mode:

```vim
:w              " Write (save) the file
:q              " Quit (fails if there are unsaved changes)
:wq  or  :x     " Save and quit (or press ZZ in Normal mode)
:q!             " Quit and discard all unsaved changes
:e!             " Reload the file from disk, discarding edits
```

> [!TIP]
> If you opened a root-owned file (such as `/etc/hosts` or `/etc/nginx/nginx.conf`) without `sudo` and already made edits, you do not need to discard your work. Write it through `sudo tee`:
>
> ```vim
> :w !sudo tee % > /dev/null
> ```
>
> Then run `:e!` to reload the saved buffer cleanly.

## 2. Fast Cursor Movement and Jumping

Stop holding down the arrow keys. Moving by words, line boundaries, and file positions is faster and composes directly with editing commands.

### Word and Line Motions

| Key | Movement |
| :--- | :--- |
| `w` / `b` | Jump to the start of the next / previous word |
| `e` | Jump to the end of the current or next word |
| `W` / `B` / `E` | Same as `w`/`b`/`e`, but treats whitespace-separated tokens as a single WORD (useful for IP addresses, URLs, and file paths) |
| `0` | Jump to column 0 (very start of the line) |
| `^` | Jump to the first non-whitespace character on the line |
| `$` | Jump to the end of the line |
| `f<c>` / `t<c>` | Jump onto (`f`) or just before (`t`) the next occurrence of character `<c>` on the current line (`;` repeats forward, `,` repeats backward) |
| `%` | Jump between matching brackets `()`, `[]`, or `{}` |

### File-Wide Jumps (Goto)

```text
gg  or  :1      Jump to the first line of the file
G   (Shift+g)   Jump to the last line of the file
42G or  :42     Jump directly to line 42
Ctrl+d / Ctrl+u Scroll down / up half a screen
zz              Center the screen on the current cursor line
Ctrl+o / Ctrl+i Jump backward / forward through your jump history
```

## 3. Deleting, Changing, and Text Objects

Vim's real power comes from its grammar: **Operator + Motion** or **Operator + Text Object**.

Start with deleting a word:

```text
dw              Delete from the cursor to the start of the next word
daw             Delete "a word" (the entire word plus one surrounding space)
diw             Delete "inner word" (the entire word, keeping surrounding spaces)
```

Unlike `dw`, both `diw` and `daw` work regardless of where your cursor sits inside the word. Once you know that pattern, the same text objects work with `d` (delete), `c` (change - delete and enter Insert mode), `y` (yank/copy), and `v` (visual select):

| Command | Effect |
| :--- | :--- |
| `dd` / `cc` / `yy` | Delete / change / yank the entire current line |
| `D` / `C` | Delete / change from the cursor to the end of the line |
| `ci"` / `da"` | Change inside double quotes / delete around double quotes (including the quotes) |
| `ci'` / `ci(` / `ci{` | Change inside single quotes, parentheses, or curly braces |
| `di[` / `yi(` | Delete inside square brackets / yank inside parentheses |
| `dap` | Delete an entire paragraph (handy for removing a block in `/etc/hosts` or an INI section) |

## 4. Undo, Redo, and the Dot Command (`.`)

| Key | Action |
| :--- | :--- |
| `u` | Undo the last change |
| `Ctrl+r` | Redo the last undone change |
| `.` | Repeat the last editing command at the current cursor position |

The dot command (`.`) pairs naturally with search. For example, if you search for `/deprecated_option`, press `dd` to delete the line, and then press `n` to jump to the next match, pressing `.` deletes it immediately without retyping anything.

## 5. Column-Wise Editing with Visual Block Mode

One of the most practical techniques for sysadmins is **Visual Block mode** (`Ctrl+v`), which lets you comment out, uncomment, or prefix dozens of lines in a single operation.

### Bulk-Insert a Prefix (e.g., Commenting Out a Config Block)

1. Move the cursor to the first character of the first line you want to edit.
2. Press `Ctrl+v` to enter Visual Block mode.
3. Move down with `j` (or `5j`, or `}` to select to the end of the block).
4. Press `Shift+i` (`I`) to enter Insert mode at the start of the selected column.
5. Type the text you want to insert (for example, `# `).
6. Press `Esc`. After a brief pause, Vim applies the insertion to every selected line.

### Bulk-Delete or Append Across a Column

- **Uncomment a block**: Press `Ctrl+v`, select down the column of `#` characters (use `l` if you also want to include a trailing space), and press `d` or `x`.
- **Append at the end of multiple lines**: Press `Ctrl+v`, select lines downward, press `$` to extend to the end of each line, press `Shift+a` (`A`), type the suffix (such as `;` or `,`), and press `Esc`.

## 6. Search and Replace

### Searching Within a File

```text
/keyword        Search forward for "keyword" (press Enter to confirm)
?keyword        Search backward for "keyword"
n               Jump to the next match (same direction)
N               Jump to the previous match (opposite direction)
*               Search forward for the exact word currently under the cursor
#               Search backward for the exact word currently under the cursor
:noh            Clear search highlighting until the next search
```

### Find and Replace (`:s`)

The substitution syntax is `:[range]s/pattern/replacement/[flags]`:

```vim
:s/old/new/             " Replace the first occurrence on the current line
:s/old/new/g            " Replace all occurrences on the current line
:%s/old/new/g           " Replace all occurrences across the entire file
:%s/old/new/gc          " Same as above, but prompt for confirmation on each match
:'<,'>s/old/new/g       " Replace only inside the active Visual selection
```

When replacing file paths or URLs containing `/`, use `#` or `|` as the delimiter so you do not have to escape every slash:

```vim
:%s#/var/www/old#/var/www/new#g
```

You can also delete every line matching a pattern (or every blank/comment line) with `:g`:

```vim
:g/^#/d                 " Delete all lines starting with #
:g/^\s*$/d              " Delete all blank or whitespace-only lines
:v/ERROR/d              " Keep only lines containing ERROR (delete non-matching lines)
```

## 7. Indentation, Tabs, and Retabbing

YAML files, Python scripts, and Kubernetes manifests break silently when tabs and spaces get mixed. Configure Vim's indentation options on the fly in Command-line mode:

```vim
" Full option names
:set tabstop=4 shiftwidth=4 expandtab softtabstop=4

" Short equivalent
:set ts=4 sw=4 sts=4 et
```

What each option controls:

- `tabstop` (`ts`): How many columns a literal `<Tab>` character displays as.
- `shiftwidth` (`sw`): Number of spaces used for auto-indent and `>>` / `<<` shift commands.
- `softtabstop` (`sts`): Number of spaces inserted or removed when pressing `Tab` or `Backspace` in Insert mode.
- `expandtab` (`et`): Insert spaces instead of a literal `<Tab>` character.

### Converting Existing Tabs to Spaces (`:retab`)

Enabling `expandtab` only affects **new** edits. To convert existing `<Tab>` characters in an already-open file into spaces:

```vim
:set tabstop=4
:set expandtab
:retab
```

> [!WARNING]
> Do **not** run `:retab` with `expandtab` on a `Makefile`, because GNU Make strictly requires literal `<Tab>` characters for recipe indentation. Use `:set noexpandtab` (`:set noet`) when editing Makefiles.

### Quick Indentation Commands

- `>>` / `<<`: Indent or unindent the current line by one `shiftwidth`.
- Select lines in Visual Line mode (`V`) and press `>` or `<` to shift the whole block (press `.` to repeat).
- `:set list` / `:set nolist`: Temporarily reveal hidden whitespace characters (tabs, trailing spaces, and line endings) when debugging stubborn YAML or shell syntax errors.

## 8. Copy, Paste, and Pasting Safely Over SSH

Basic yank and paste:

```text
yy              Yank (copy) the current line
5yy             Yank 5 lines
p / P           Paste after / before the cursor (or below / above for linewise yanks)
"0p             Paste the most recently yanked text (ignores subsequent deletes)
```

When pasting a multi-line config snippet from your local clipboard into a remote terminal over SSH, Vim's auto-indentation can cause a staircase effect where every line indents further to the right. Toggle paste mode before pasting:

```vim
:set paste
" Press i, paste from your terminal clipboard, then press Esc
:set nopaste
```

## 9. Split Windows and `vimdiff`

You rarely inspect a single config file in isolation. Open a second file side by side without leaving Vim:

```vim
:vsp /etc/nginx/nginx.conf      " Open in a vertical split
:sp  /var/log/nginx/error.log   " Open in a horizontal split
```

Navigate between splits with `Ctrl+w` followed by `h`, `j`, `k`, or `l` (or press `Ctrl+w w` to cycle). Close the active split with `:q`.

To compare two configuration files (such as a running config and a `.rpmnew` or `.bak` file) directly from the shell, use `vimdiff`:

```bash
vimdiff /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
```

Inside `vimdiff`:

- `]c` / `[c`: Jump to the next / previous difference.
- `do` (diff obtain): Pull the change from the other window into the current window.
- `dp` (diff put): Push the change from the current window to the other window.

## 10. A Minimal, Server-Ready `~/.vimrc`

You do not need a plugin manager on production servers. Dropping a short, dependency-free `~/.vimrc` on your bastion host or user profile gives you sensible defaults without breaking compatibility with minimal `vim` packages:

```vim
" ~/.vimrc - minimal baseline for Linux servers
set nocompatible
syntax on
filetype plugin indent on

" Line numbers and visual clarity
set number
set cursorline
set showcmd
set wildmenu

" Indentation defaults (4 spaces)
set tabstop=4
set shiftwidth=4
set softtabstop=4
set expandtab
set autoindent

" Use 2-space indentation automatically for YAML and JSON
autocmd FileType yaml,yml,json setlocal ts=2 sw=2 sts=2 et

" Search behavior
set incsearch
set hlsearch
set ignorecase
set smartcase

" Keep context lines visible around the cursor when scrolling
set scrolloff=5

" Prevent swap/backup clutter in read-only or ephemeral directories if desired
set nobackup
set nowritebackup
```

With `ignorecase` and `smartcase` enabled together, searching `/nginx` matches case-insensitively, while `/NGINX` automatically switches to case-sensitive matching.

## Quick Reference Summary

If you only memorize a handful of commands first, start with these ten:

| Task | Command |
| :--- | :--- |
| Save as root when you forgot `sudo` | `:w !sudo tee % >/dev/null` |
| Jump to top / bottom / line 50 | `gg` / `G` / `50G` |
| Jump to first non-blank / end of line | `^` / `$` |
| Delete inner word / around word | `diw` / `daw` |
| Change inside quotes | `ci"` |
| Bulk-comment a block | `Ctrl+v`, move down, `I`, `# `, `Esc` |
| Search forward / next / previous | `/term`, `n`, `N` |
| Replace across entire file | `:%s/old/new/gc` |
| Convert tabs to 4 spaces | `:set ts=4 sw=4 sts=4 et` then `:retab` |
| Paste cleanly over SSH | `:set paste` -> paste -> `:set nopaste` |
