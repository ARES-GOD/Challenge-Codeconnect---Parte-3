import { useEffect, type FC } from "react";
import Navbar from "../components/Filters/NavBar/Navbar";
import Tags from "../components/Filters/Tags";
import { useAppDispatch, useAppSelector } from "../hooks/hooks";
import {
  selectAllProjects,
  selectProjectStatus,
  fetchProjects,
  selectPaginationInfo,
  clearProjects,
  setCurrentPage,
  selectFilters,
  setFilters,
  selectAllTags,
} from "../redux/projectsSlice";
import ProjectCard from "../components/ProjectCard";

interface IProps {};

const Feed: FC<IProps> = () => {
  const dispatch = useAppDispatch();

  const status   = useAppSelector(selectProjectStatus);
  const filters  = useAppSelector(selectFilters);
  const allTags  = useAppSelector(selectAllTags);
  const { currentPage, totalPages } = useAppSelector(selectPaginationInfo);

  const projects = useAppSelector(selectAllProjects);

  // Dispara el fetch cuando cambian filtros o página
  useEffect(() => {
    // dispatch(clearProjects());
    dispatch(fetchProjects());
  }, [dispatch, filters, currentPage]);

  // Handlers de UI
  const gotoPage = (page: number) => {
    if (page !== currentPage) dispatch(setCurrentPage(page));
  };

  const onSearchChange = (text: string) => {
    dispatch(setFilters({ ...filters, busqueda: text.trim().toLowerCase() }));
  };

  const onToggleTag = (tag: string) => {
    const isActive = filters.tags.includes(tag);
    const nextTags = isActive
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    dispatch(setFilters({ ...filters, tags: nextTags }));
  };

  const onClearAll = () => {
    dispatch(setFilters({ tags: [], busqueda: "" }));
  };

  // UI
  const Tabs = (
    <div className="flex items-center justify-center gap-10 mt-4">
      {[1, 2].map((p) => (
        <button
          key={p}
          onClick={() => gotoPage(p)}
          className={[
            "text-lg",
            p === currentPage ? "text-[#6FFFB0] font-semibold" : "text-gray-400 hover:text-gray-300",
            "transition-colors"
          ].join(" ")}
        >
          Recientes
        </button>
      ))}
    </div>
  );

  if (status === "loading") {
    return (
      <div className="w-[996px]">
        <div className="flex flex-col gap-[16px] mt-1">
          <Navbar value={filters.busqueda} onChange={onSearchChange} onClearAll={onClearAll} />
          <Tags tags={allTags} active={filters.tags} onToggle={onToggleTag} onClearAll={onClearAll} />
        </div>
        {Tabs}
        <div className="flex justify-center items-center h-64">
          <p className="text-white">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="w-[996px]">
        <div className="flex flex-col gap-[16px] mt-1">
          <Navbar value={filters.busqueda} onChange={onSearchChange} onClearAll={onClearAll} />
          <Tags tags={allTags} active={filters.tags} onToggle={onToggleTag} onClearAll={onClearAll} />
        </div>
        {Tabs}
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Error cargando proyectos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[996px]">
      <div className="flex flex-col gap-[16px] mt-1">
        <Navbar value={filters.busqueda} onChange={onSearchChange} onClearAll={onClearAll} />
        <Tags tags={allTags} active={filters.tags} onToggle={onToggleTag} onClearAll={onClearAll} />
      </div>

      {Tabs}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {projects.length > 0 ? (
          projects.map((project) => <ProjectCard key={project.id} project={project} />)
        ) : (
          <div className="col-span-2 flex justify-center items-center h-64">
            <p className="text-gray-400">No se encontraron proyectos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
