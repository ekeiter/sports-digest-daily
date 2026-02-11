import blimpLogo from "@/assets/sportsdig-blimp-logo.png";

export default function BrandedLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg">
      <div className="relative w-full overflow-hidden h-36 md:h-44 mb-4 flex items-center">
        <img
          src={blimpLogo}
          alt="SportsDig"
          className="h-28 md:h-36 w-auto absolute top-1/2 animate-blimp-fly"
        />
      </div>
      <h1 className="font-racing text-4xl md:text-5xl text-foreground animate-pulse">
        SportsDig
      </h1>
    </div>
  );
}
