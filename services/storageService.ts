import { AppState } from '../types';

const STORAGE_KEY = 'guruPintarData';

export const storageService = {
  save: (data: AppState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Gagal menyimpan data ke browser:", error);
      alert("Peringatan: Penyimpanan penuh atau error browser.");
    }
  },

  load: (): AppState | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }
    return null;
  },

  exportData: (data: AppState) => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_gurupintar_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importData: (file: File): Promise<AppState> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          // Simple validation checks
          if (json.classes && json.students && json.settings) {
            resolve(json);
          } else {
            reject(new Error("Format file tidak valid. Pastikan file berasal dari backup GuruPintar."));
          }
        } catch (e) {
          reject(new Error("Gagal membaca file JSON."));
        }
      };
      reader.onerror = () => reject(new Error("Error reading file"));
      reader.readAsText(file);
    });
  }
};