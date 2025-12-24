import Head from "next/head";
import { useState } from "react";
import { db } from "../components/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FaUpload, FaImage } from "react-icons/fa";
import styles from "./push.module.css";

const API_KEY = "d3b627c6d75013b8aaf2aac6de73dcb5";

export default function Push() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Upload image to imgbb
  const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    return data.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const uploadedImages = [];

      for (let i = 0; i < images.length; i++) {
        const imageUrl = await uploadImage(images[i]);
        uploadedImages.push(imageUrl);
      }

      await addDoc(collection(db, "websites"), {
        name: name.trim(),
        description: description.trim(),
        previewUrl: previewUrl.trim(),
        price: Number(price), // RWF
        image: uploadedImages[0], // main image
        images: uploadedImages,   // all images
        createdAt: serverTimestamp(),
      });

      setStatus("Website yabitswe neza ✅");

      // reset form
      setName("");
      setDescription("");
      setPreviewUrl("");
      setPrice("");
      setImages([]);
    } catch (error) {
      console.error(error);
      setStatus("Habaye ikibazo mu kubika ❌");
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Push Website | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <main className={styles.container}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1>Ongeramo Website</h1>

          <input
            type="text"
            placeholder="Izina rya Website"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder="Ibisobanuro bya Website"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Igiciro (RWF)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <input
            type="url"
            placeholder="Preview URL (https://...)"
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            required
          />

          <label className={styles.fileLabel}>
            <FaImage /> Hitamo Ifoto / Amafoto
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => setImages(e.target.files)}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            <FaUpload />
            {loading ? " Biri kubikwa..." : " Bika Website"}
          </button>

          {status && <p className={styles.status}>{status}</p>}
        </form>
      </main>
    </>
  );
}
