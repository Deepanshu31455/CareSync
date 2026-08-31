import React from 'react'
import Navbar from "../components/FirstPage_Navbar.jsx";
import Hero from "../components/FirstPage/FirstPage_Hero.jsx";
import About from "../components/FirstPage/FirstPage_About.jsx";
import Features from "../components/FirstPage/FirstPage_Features.jsx";
import HowItWorks from "../components/FirstPage/FirstPage_HowItWorks.jsx";
import TrustBar from "../components/FirstPage/FirstPage_TrustBar.jsx";
import Testimonials from "../components/FirstPage/FirstPage_Testimonials.jsx";
import FAQ from "../components/FirstPage/FirstPage_FAQ.jsx";
import Footer from "../components/FirstPage_Footer.jsx";
  

const FirstPage = () => {
  return (
    <div>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Features />
        <HowItWorks />
        <TrustBar />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

export default FirstPage
