import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError("Erreur de connexion. Vérifiez l'email et le mot de passe.");
      console.error(err);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
      setError("Erreur lors de la création du compte. L'utilisateur existe peut-être déjà.");
      console.error(err);
    }
  };

  return (
    <div className="card" style={{maxWidth: '400px', margin: '5rem auto'}}>
      <h1>Connexion</h1>
      <form>
        <p>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </p>
        <p>
          <label>Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </p>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div style={{display: 'flex', gap: '1rem'}}>
          <button type="submit" onClick={handleSignIn} style={{flex: 1}}>Se Connecter</button>
          <button type="button" onClick={handleSignUp} style={{flex: 1, backgroundColor: '#666'}}>Créer un compte</button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
