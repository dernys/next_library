import { SearchMaterials } from "@/components/search-materials"
import { HeroSection } from "@/components/hero-section"
import { FeaturedMaterials } from "@/components/featured-materials"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <HeroSection />
      <div className="my-8">
        <SearchMaterials />
      </div>
      <FeaturedMaterials />
    </div>
  )
}
