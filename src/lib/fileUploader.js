// lib/fileUploader.js
import { supabase } from "./supabaseClient";

export async function uploadFiles(files, userId) {
  const arquivos = [];
  for (const file of files) {
    console.log("🟠 Iniciando upload do arquivo:", file.name);
    // Gera nome único
    const ext = file.name.split(".").pop();
    const uuid = crypto.randomUUID();
    const caminho = `user_${userId}/${uuid}.${ext}`;

    // Faz o upload
    const { data, error } = await supabase.storage
      .from("mensagens-arquivos")
      .upload(caminho, file);

    if (error || !data) {
      console.warn("Erro ao enviar arquivo:", error?.message || "Desconhecido");
      continue;
    }

    const { data: urlData } = supabase.storage
      .from("mensagens-arquivos")
      .getPublicUrl(data.path);

    let tipo = "arquivo";
    if (file.type.startsWith("image/")) tipo = "imagem";
    else if (file.type.startsWith("video/")) tipo = "video";
    else if (file.type.startsWith("audio/")) tipo = "audio";

    console.log("🟢 Arquivo enviado:", {
        path: data.path,
        url: urlData?.publicUrl,
        nome: file.name,
        tipo
      });

    arquivos.push({
      url: urlData.publicUrl,
      nome: file.name,
      tipo
    });
  }

  return arquivos;
}
