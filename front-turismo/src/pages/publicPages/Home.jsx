import { useState } from "react";
import HeroBanner from "../../Components/publicComponents/Home/HeroBanner";
import CategoryGrid from "../../Components/publicComponents/Home/CategoryGrid";
import SearchResults from "../../Components/publicComponents/Home/SearchResults";
import PromoSection from "../../Components/publicComponents/Home/PromoSection";

export default function Home() {
  const [resultados, setResultados] = useState([]);

  return (
    <>
      <HeroBanner setResultados={setResultados} />
      <SearchResults resultados={resultados} />
      <CategoryGrid />
      <PromoSection />
    </>
  );
}