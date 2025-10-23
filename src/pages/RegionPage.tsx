import { useParams, Link } from "react-router-dom";
import { CatalogContentRow } from "../components/CatalogContentRow";
import { ArrowLeft } from "lucide-react";

export default function RegionPage() {
  const { name } = useParams<{ name: string }>();

  return (
    <div className="min-h-screen bg-slate-950 pt-20">
      <div className="container mx-auto pb-16">
        <div className="mb-8 px-4">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white">{name} Titles</h1>
          <p className="mt-2 text-slate-400">
            Films set in {name}
          </p>
        </div>

        <CatalogContentRow
          title={`${name} Films`}
          where={{ region: name }}
          sort="newest"
          limit={48}
          emptyText={`No films from ${name} available`}
        />
      </div>
    </div>
  );
}
