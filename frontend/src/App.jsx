import { useState } from 'react'
import FirstPage from "./pages/FirstPage"
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
        <FirstPage />
    </div>
  )
}

export default App
