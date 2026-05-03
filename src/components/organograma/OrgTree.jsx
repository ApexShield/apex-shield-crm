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
          {/* Vertical line down from parent */}
          <div className="w-px h-2 md:h-6 bg-white/30" />

          <div className="flex items-start">
            {subordinados.map((sub, idx) => {
              const subSubs = sub.subordinados || [];
              const isFirst = idx === 0;
              const isLast = idx === subordinados.length - 1;
              const isOnly = subordinados.length === 1;

              return (
                <div key={sub.id} className="flex flex-col items-center px-0.5 md:px-3">
                  {/* Horizontal connector */}
                  {!isOnly && (
                    <div className="relative w-full h-0 flex justify-center">
                      <div
                        className="absolute top-0 h-px md:h-0.5 bg-white/25"
                        style={{
                          left: isFirst ? '50%' : 0,
                          right: isLast ? '50%' : 0,
                        }}
                      />
                    </div>
                  )}
                  {/* Vertical line to child */}
                  <div className="w-px h-2 md:h-6 bg-white/25" />
                  
                  <OrgUserCard
                    usuario={sub}
                    clickable={clickable}
                    onClick={() => onClickUser?.(sub)}
                  />

                  {/* Sub-subordinados */}
                  {subSubs.length > 0 && (
                    <>
                      <div className="w-px h-1.5 md:h-4 bg-white/20" />
                      
                      {/* Mobile: compact vertical list | Desktop: horizontal wrap */}
                      <div className="md:hidden bg-white/5 border border-white/10 rounded-md p-1">
                        <div className="text-center mb-0.5">
                          <span className="text-[6px] text-white/40 uppercase tracking-wider font-medium">
                            Equipe
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {subSubs.map((subSub) => (
                            <OrgTree
                              key={subSub.id}
                              usuario={subSub}
                              onClickUser={onClickUser}
                              clickable={clickable}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="hidden md:block relative bg-white/5 border border-white/15 rounded-xl p-4 pt-2">
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