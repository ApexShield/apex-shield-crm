import OrgUserCard from "./OrgUserCard";

export default function OrgTree({ usuario, onClickUser, clickable }) {
  const subordinados = usuario.subordinados || [];

  return (
    <div className="flex flex-col items-center">
      <OrgUserCard
        usuario={usuario}
        clickable={clickable}
        onClick={() => onClickUser?.(usuario)}
      />

      {subordinados.length > 0 && (
        <>
          {/* Linha vertical para baixo */}
          <div className="w-0.5 h-8 bg-white/30" />

          {/* Container de subordinados */}
          <div className="relative flex gap-6">
            {/* Linha horizontal conectando */}
            {subordinados.length > 1 && (
              <div
                className="absolute top-0 h-0.5 bg-white/25"
                style={{
                  left: `calc(50% - ${(subordinados.length - 1) * 50}% + 70px)`,
                  right: `calc(50% - ${(subordinados.length - 1) * 50}% + 70px)`,
                }}
              />
            )}

            {subordinados.map((sub) => (
              <div key={sub.id} className="relative flex flex-col items-center">
                {/* Linha vertical para cada subordinado */}
                <div className="w-0.5 h-8 bg-white/25" />
                <OrgTree usuario={sub} onClickUser={onClickUser} clickable={clickable} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}