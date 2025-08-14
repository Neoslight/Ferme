import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db, storage } from '../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const EditAnimalPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [rations, setRations] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchAnimalAndRations = async () => {
      // Fetch Rations
      const rationsSnapshot = await getDocs(collection(db, 'rations'));
      const rationsList = rationsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRations(rationsList);

      // Fetch Animal
      const animalDocRef = doc(db, 'animals', id);
      const animalDoc = await getDoc(animalDocRef);
      if (animalDoc.exists()) {
        const data = animalDoc.data();
        const birthDate = data.dateDeNaissance ? new Date(data.dateDeNaissance.seconds * 1000).toISOString().split('T')[0] : '';
        setFormData({ ...data, dateDeNaissance: birthDate });
      }
    };
    fetchAnimalAndRations();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom || !formData.espece) {
      alert("Le nom et l'espèce sont obligatoires.");
      return;
    }
    try {
      const animalDocRef = doc(db, 'animals', id);
      const dataToUpdate = { ...formData };
      delete dataToUpdate.photoURL; // Don't update photoURL via this form

      await updateDoc(animalDocRef, {
        ...dataToUpdate,
        dateDeNaissance: formData.dateDeNaissance ? new Date(formData.dateDeNaissance) : null
      });
      alert("Informations mises à jour !");
      navigate(`/animal/${id}`);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Erreur lors de la mise à jour de l'animal.");
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageUpload = () => {
    if (!imageFile) {
      alert("Veuillez d'abord sélectionner une image.");
      return;
    }
    const storageRef = ref(storage, `animal-photos/${id}/${imageFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, imageFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        alert("Le téléversement a échoué.");
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          const animalDocRef = doc(db, 'animals', id);
          updateDoc(animalDocRef, { photoURL: downloadURL });
          setFormData(prev => ({ ...prev, photoURL: downloadURL }));
          alert("Photo mise à jour avec succès !");
          setUploadProgress(0);
          setImageFile(null);
        });
      }
    );
  };

  if (!formData) {
    return <p>Chargement...</p>;
  }

  return (
    <div>
      <h1>Modifier {formData.nom}</h1>

      <div className="card">
        <h3>Photo de Profil</h3>
        {formData.photoURL && <img src={formData.photoURL} alt={formData.nom} style={{width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem'}}/>}
        <input type="file" accept="image/*" onChange={handleFileSelect} />
        <button onClick={handleImageUpload} disabled={!imageFile || uploadProgress > 0} style={{marginTop: '0.5rem'}}>
          {uploadProgress > 0 ? `Téléversement: ${Math.round(uploadProgress)}%` : 'Mettre à jour la photo'}
        </button>
        {uploadProgress > 0 && <progress value={uploadProgress} max="100" style={{width: '100%', marginTop: '0.5rem'}}/>}
      </div>

      <form onSubmit={handleSubmit} className="card">
        <h3>Informations Générales</h3>
        <p>
          <label>Nom: </label>
          <input type="text" name="nom" value={formData.nom} onChange={handleChange} required />
        </p>
        <p>
          <label>Espèce: </label>
          <input type="text" name="espece" value={formData.espece} onChange={handleChange} required />
        </p>
        <p>
          <label>Race: </label>
          <input type="text" name="race" value={formData.race} onChange={handleChange} />
        </p>
        <p>
          <label>Caractère: </label>
          <input type="text" name="caractere" value={formData.caractere || ''} onChange={handleChange} placeholder="Ex: Docile, craintif..."/>
        </p>
        <p>
          <label>Date de naissance: </label>
          <input type="date" name="dateDeNaissance" value={formData.dateDeNaissance} onChange={handleChange} />
        </p>
        <p>
          <label>Sexe: </label>
          <select name="sexe" value={formData.sexe} onChange={handleChange}>
            <option value="Mâle">Mâle</option>
            <option value="Femelle">Femelle</option>
          </select>
        </p>
         <p>
          <label>Statut: </label>
          <select name="statut" value={formData.statut} onChange={handleChange}>
            <option value="Présent">Présent</option>
            <option value="Vendu">Vendu</option>
            <option value="Décédé">Décédé</option>
          </select>
        </p>
        <p>
          <label>Ration Alimentaire: </label>
          <select name="rationId" value={formData.rationId || ''} onChange={handleChange}>
            <option value="">Aucune</option>
            {rations.map(ration => (
              <option key={ration.id} value={ration.id}>{ration.name}</option>
            ))}
          </select>
        </p>
        <button type="submit">Mettre à jour les informations</button>
      </form>
    </div>
  );
};

export default EditAnimalPage;
