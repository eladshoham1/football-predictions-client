import React from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function SignIn({ onDone }: { onDone?: () => void }) {
  function googleSignIn() {
    // Redirect to server-side Google OAuth endpoint
    window.location.href = `${API_URL}/auth/google`
  }

  return (
    <div className="form-card" aria-label="Sign in">
      <h3>התחברות באמצעות Google</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={googleSignIn}>Sign in with Google</button>
      </div>
    </div>
  )
}
