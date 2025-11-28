
import { GoogleGenAI } from "@google/genai";
import { ExamQuestion } from "../types";

// Initialize the Gemini client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set via environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStudentFeedback = async (
  studentName: string,
  averageScore: number,
  strengths: string[],
  weaknesses: string[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Layanan AI tidak tersedia. Cek konfigurasi API Key.";

  try {
    const prompt = `
      Bertindaklah sebagai guru yang bijaksana dan suportif di sekolah Indonesia.
      Buatlah narasi deskripsi rapor singkat (maksimal 3 kalimat) untuk siswa bernama ${studentName}.
      Nilai rata-rata: ${averageScore}.
      Kekuatan akademik: ${strengths.join(', ') || 'Cukup baik secara umum'}.
      Area yang perlu ditingkatkan: ${weaknesses.join(', ') || 'Pertahankan prestasi'}.
      Gunakan bahasa Indonesia yang formal namun memotivasi, fokus pada apresiasi proses belajar.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating feedback:", error);
    return "Gagal menghasilkan saran otomatis. Silakan tulis manual.";
  }
};

export const analyzeClassTrends = async (
  className: string,
  scores: number[]
): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Analisis tidak tersedia.";

    const average = scores.reduce((a,b) => a+b, 0) / scores.length;
    
    try {
        const prompt = `
        Analisis data nilai kelas ${className}.
        Rata-rata kelas: ${average.toFixed(2)}.
        Sebaran nilai: ${JSON.stringify(scores)}.
        Berikan 3 rekomendasi strategi mengajar singkat untuk guru berdasarkan data ini untuk meningkatkan hasil belajar.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        return "Gagal menganalisis data.";
    }
};

export const analyzeTalent = async (
  studentName: string,
  questionnaireTitle: string,
  scoresByCategory: Record<string, number>
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Analisis AI tidak tersedia.";

  try {
    const scoresStr = Object.entries(scoresByCategory)
      .map(([cat, score]) => `${cat}: ${score}`)
      .join(', ');

    const prompt = `
      Bertindaklah sebagai konselor pendidikan profesional dan psikolog sekolah.
      Siswa bernama ${studentName} telah mengisi kuesioner "${questionnaireTitle}".
      
      Hasil Skor per Kategori:
      ${scoresStr}

      Tugas Anda:
      1. Identifikasi gaya belajar atau potensi dominan siswa.
      2. Berikan 3 strategi belajar spesifik yang cocok untuk siswa ini.
      3. Sarankan 2 potensi karir atau bidang studi masa depan yang relevan.
      
      Gunakan bahasa Indonesia yang personal, memotivasi, dan mudah dipahami siswa. Format output dalam poin-poin singkat.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Talent analysis error:", error);
    return "Gagal melakukan analisis bakat saat ini.";
  }
};

export const generateExamQuestions = async (
  topic: string,
  level: string,
  count: number,
  type: 'MULTIPLE_CHOICE' | 'ESSAY'
): Promise<ExamQuestion[]> => {
  const ai = getAiClient();
  if (!ai) throw new Error("AI Client not initialized");

  try {
    const prompt = `
      Buatkan ${count} soal ujian ${type === 'MULTIPLE_CHOICE' ? 'Pilihan Ganda' : 'Essay'} 
      untuk topik "${topic}" tingkat sekolah ${level}.
      
      Output WAJIB dalam format JSON Array murni tanpa format markdown code block.
      
      Struktur JSON per item:
      {
        "text": "Pertanyaan",
        "points": 10,
        ${type === 'MULTIPLE_CHOICE' ? `
        "options": [
           {"text": "Pilihan A", "isCorrect": false},
           {"text": "Pilihan B (Jawaban Benar)", "isCorrect": true},
           {"text": "Pilihan C", "isCorrect": false},
           {"text": "Pilihan D", "isCorrect": false}
        ]
        ` : `
        "answerKey": "Kunci jawaban atau poin-poin penting jawaban"
        `}
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    // Clean raw text just in case, though mimeType helps
    let cleanJson = response.text.trim();
    if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '');
    }

    const parsed = JSON.parse(cleanJson);
    
    // Add IDs
    return parsed.map((q: any) => ({
      ...q,
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      type: type,
      options: q.options ? q.options.map((o: any) => ({...o, id: Math.random().toString(36).substr(2,9)})) : []
    }));

  } catch (error) {
    console.error("Generate exam error:", error);
    throw new Error("Gagal membuat soal. Coba lagi.");
  }
};
