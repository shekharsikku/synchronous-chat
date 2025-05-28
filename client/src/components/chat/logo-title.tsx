const Logo = () => {
  return (
    <div className="flex py-2 px-4 justify-start items-center gap-2 h-full">
      <svg
        id="synchronous-logo"
        width="78"
        height="32"
        viewBox="0 0 78 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {" "}
        <path
          d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
          className="ccustom"
          fill="#e0e0e0"
        ></path>{" "}
        <path
          d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
          className="ccompli1"
          fill="#eeeeee"
        ></path>{" "}
        <path
          d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
          className="ccompli2"
          fill="#f5f5f5"
        ></path>{" "}
      </svg>
      <h1 className="text-2xl lg:text-3xl font-extrabold">Synchronous</h1>
    </div>
  );
};

const Title = ({ title }: { title: string }) => {
  return (
    <h5 className="uppercase tracking-widest text-neutral-500 dark:text-neutral-50 font-light text-opacity-90 text-xs lg:text-sm">
      {title}
    </h5>
  );
};

export { Logo, Title };
