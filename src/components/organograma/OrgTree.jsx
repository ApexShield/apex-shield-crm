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
          {/* Linha vertical do pai para baixo */}
          <div className="w-0.5 h-8 bg-white/30" />

          {/* Linha horizontal conectando os filhos */}
          {subordinados.length > 1 && (
            <div className="relative w-full flex justify-center">
              <div className="flex">
                {subordinados.map((sub, idx) => (
                  <div key={sub.id} className="flex flex-col items-center" style={{ minWidth: 0 }}>
                    {/* Célula vazia para medir posição — invisível */}
                    <div className="w-full" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start">
            {subordinados.map((sub, idx) => {
              const subSubs = sub.subordinados || [];
              const isFirst = idx === 0;
              const isLast = idx === subordinados.length - 1;
              const isOnly = subordinados.length === 1;

              return (
                <div key={sub.id} className="flex flex-col items-center px-3">
                  {/* Conector horizontal + vertical */}
                  {!isOnly && (
                    <div className="relative w-full h-0 flex justify-center">
                      {/* Linha horizontal */}
                      <div
                        className="absolute top-0 h-0.5 bg-white/25"
                        style={{
                          left: isFirst ? '50%' : 0,
                          right: isLast ? '50%' : 0,
                        }}
                      />
                    </div>
                  )}
                  {/* Linha vertical para o filho */}
                  <div className="w-0.5 h-8 bg-white/25" />
                  
                  {/* Card do subordinado */}
                  <OrgUserCard
                    usuario={sub}
                    clickable={clickable}
                    onClick={() => onClickUser?.(sub)}
                  />

                  {/* Sub-subordinados com agrupamento visual */}
                  {subSubs.length > 0 && (
                    <>
                      <div className="w-0.5 h-6 bg-white/20" />
                      
                      {/* Container com borda de grupo */}
                      <div className="relative bg-white/5 border border-white/15 rounded-xl p-4 pt-2">
                        {/* Label do grupo */}
                        <div className="text-center mb-3">
                          <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                            Equipe de {sub.full_name?.split(" ")[0] || "Líder"}
                          </span>
                        </div>

                        <div className="flex items-start gap-3 flex-wrap justify-center">
                          {subSubs.map((subSub) => (
                            <div key={subSub.id} className="flex flex-col items-center">
                              <OrgTree
                                usuario={subSub}
                                onClickUser={onClickUser}
                                clickable={clickable}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}