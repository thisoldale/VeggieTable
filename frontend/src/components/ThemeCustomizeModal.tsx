import React, { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition, Popover } from '@headlessui/react';
import { HexColorPicker } from 'react-colorful';
import { useTheme, Theme } from '../context/ThemeContext';
import { hslToHex, hexToHsl } from '../utils/colors';

interface ThemeCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeCustomizeModal: React.FC<ThemeCustomizeModalProps> = ({ isOpen, onClose }) => {
  const { theme: activeTheme, setTheme, saveTheme, themes } = useTheme();
  const [customTheme, setCustomTheme] = useState<Theme>(activeTheme);
  const [newThemeName, setNewThemeName] = useState('');

  useEffect(() => {
    setCustomTheme(activeTheme);
    setNewThemeName(activeTheme.name);
  }, [activeTheme, isOpen]);

  const handleColorChange = (key: keyof Theme['colors'], value: string) => {
    const hslValue = hexToHsl(value);
    setCustomTheme(prevTheme => ({
      ...prevTheme,
      colors: { ...prevTheme.colors, [key]: hslValue },
    }));
  };

  const handleSave = () => {
    if (!newThemeName) {
      alert('Please enter a name for the theme.');
      return;
    }
    saveTheme({ ...customTheme, name: newThemeName });
    onClose();
  };

  const handleThemeSelection = (themeName: string) => {
    const selected = themes.find(t => t.name === themeName);
    if (selected) {
      setCustomTheme(selected);
      setNewThemeName(selected.name);
      setTheme(themeName);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-component-background p-6 text-left align-middle shadow-xl transition-all">
              <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-foreground mb-4">
                Customize Theme
              </Dialog.Title>

              <div className="mb-4">
                <label htmlFor="theme-select" className="block text-sm font-medium text-foreground mb-1">Select Theme</label>
                <select
                  id="theme-select"
                  value={activeTheme.name}
                  onChange={(e) => handleThemeSelection(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-component-background text-foreground"
                >
                  {themes.map(t => <option key={t.name} value={t.name}>{t.name.charAt(0).toUpperCase() + t.name.slice(1)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-2">
                {Object.entries(customTheme.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="capitalize text-sm text-foreground/80">
                      {key.replace(/-/g, ' ')}
                    </label>
                    <Popover className="relative">
                      <Popover.Button
                        className="w-16 h-8 rounded-md border border-border"
                        style={{ backgroundColor: value }}
                      />
                      <Popover.Panel className="absolute z-10 right-0 mt-2">
                        <HexColorPicker
                          color={hslToHex(value)}
                          onChange={(newColor) => handleColorChange(key as keyof Theme['colors'], newColor)}
                        />
                      </Popover.Panel>
                    </Popover>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col space-y-4 md:flex-row md:space-y-0 md:justify-between md:items-center">
                <div className="flex items-center w-full">
                  <label htmlFor="theme-name" className="capitalize text-sm font-medium text-foreground mr-2 whitespace-nowrap">Theme Name:</label>
                  <input
                    id="theme-name"
                    type="text"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-component-background text-foreground"
                    placeholder="Enter custom theme name..."
                  />
                </div>
                <div className="flex justify-end w-full space-x-2">
                  <button onClick={onClose} className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90">Cancel</button>
                  <button onClick={handleSave} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90">Save</button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ThemeCustomizeModal;
