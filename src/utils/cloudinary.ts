/**
 * Uploads an image blob to Cloudinary and returns the secure URL.
 * To use this, you must have a Cloudinary account.
 * For the hackathon, we will use a fallback logic if env vars are missing.
 */
export async function uploadImageToCloudinary(imageBlob: Blob): Promise<string> {
  // Try to get from Vite env vars
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // Fallback if env vars not provided: ImgBB Free API (Just for quick testing)
  if (!cloudName || !uploadPreset) {
    console.warn("Cloudinary env vars not found. Falling back to ImgBB.");
    const formData = new FormData();
    formData.append("image", imageBlob);
    
    // Public free key for imgbb just for demonstration
    const IMGBB_API_KEY = "64f169f45107ad0e227a8fc091386ab5"; 
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data && data.data && data.data.url) {
        return data.data.url;
      }
      throw new Error("ImgBB upload failed");
    } catch (error) {
      console.error(error);
      throw new Error("Failed to upload image to fallback provider.");
    }
  }

  // Real Cloudinary Upload
  const formData = new FormData();
  formData.append("file", imageBlob);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || "Upload failed");
    }
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary.");
  }
}
