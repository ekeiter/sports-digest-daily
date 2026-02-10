import blimpLogo from "@/assets/sportsdig-blimp-logo.png";

export default function BrandedLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#D5D5D5]">
      <div className="relative w-full overflow-hidden h-24 mb-4">
        <img
          src={blimpLogo}
          alt="SportsDig"
          className="h-16 md:h-20 w-auto absolute animate-blimp-fly"
        />
      </div>
      <h1 className="font-racing text-4xl md:text-5xl text-black animate-pulse">
        SportsDig
      </h1>
    </div>
  );
}
