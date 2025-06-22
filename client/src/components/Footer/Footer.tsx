import { AnimatedTooltip } from "../ui/animated-tooltip";
import EyeLogo from "@/components/ui/EyeLogo";

const Footer = () => {
    const people = [
        {
          id: 1,
          name: "Sarang Rastogi",
          designation: "FullStack Developer",
          linkedin: "https://www.linkedin.com/in/sarang-rastogi-498948249/",
          github: "https://github.com/Sarang19114",
          image:
            "/sarang.png",
        
        },
        {
            id: 3,
            name: "Janvi Chauhan",
            designation: "Machine Learning Developer",
            image:
              "/janvi.png",
            linkedin: "https://www.linkedin.com/in/janvi-chauhan-9297a92a1/",
            github: "https://github.com/janvi-c16",
        },
        {
            id: 4,
            name: "Ruqayya Shah",
            designation: "Machine Learning & Frontend Developer",
            linkedin: "https://www.linkedin.com/in/ruqayya-shah-92032923b/",
            github: "",
            image:
              "/ruqayya.png",
        },
        {
          id: 2,
          name: "Naina Jain",
          designation: "Machine Learning Developer",
          linkedin: "https://www.linkedin.com/in/naina-jain-977682303/",
          github: "https://github.com/Naina2308",
          image:
            "/naina.png",
        },
        {
            id: 5,
            name: "Tejas Chauhan",
            designation: "Flask Backend Developer",
            linkedin: "https://www.linkedin.com/in/tejas-chauhan-3051a2275/",
            github: "https://github.com/Sandblaze05",
            image:
              "/tejas.png",
        },
      ];
  return (
    <div>
          <footer className="bg-white dark:bg-zinc-950">
              <div className="mx-auto w-full max-w-screen-xl p-4 py-6">
                  <div className="md:flex md:justify-between">
                      <div className="mb-2 md:mb-0">
                        <div className="flex flex-row items-center justify-left w-full mb-4">
                            <span className="ml-1 self-center text-2xl font-semibold whitespace-nowrap pr-4 dark:text-white">
                                  The W Developers: 
                            </span>
                          <AnimatedTooltip items={people} />
                          </div>
                          <div className="flex items-center justify-left w-full mb-4">
                            <EyeLogo size={25} />
                          <a href="/" className="flex items-center">
                              <span className="ml-2 self-center text-2xl font-semibold whitespace-nowrap text-lime-500">
                                  Stocket
                              </span>
                          </a>
                          </div>
                          <p>Stocket is a sophisticated stock price prediction platform.<br/>The application leverages neural networks to forecast stock prices.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
                          <div>
                              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                                  Follow us
                              </h2>
                              <ul className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                                  <li className="mb-4">
                                      <a
                                          href="https://github.com/Sarang19114"
                                          className="hover:underline "
                                      >
                                          Github
                                      </a>
                                  </li>
                                  <li>
                                      <a
                                          href="mailto:rastogi.sarang19@gmail.com"
                                          className="hover:underline"
                                      >
                                          Mail
                                      </a>
                                  </li>
                              </ul>
                          </div>
                          <div>
                              <h2 className="mb-6 text-sm font-semibold text-gray-900 uppercase dark:text-white">
                                  Legal
                              </h2>
                              <ul className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                                  <li className="mb-4">
                                      <a href="/privacypolicy" className="hover:underline">
                                          Privacy Policy
                                      </a>
                                  </li>
                                  <li>
                                      <a href="/termsandconditions" className="hover:underline">
                                          Terms &amp; Conditions
                                      </a>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>
                  <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8"/>
                  <div className="sm:flex sm:items-center sm:justify-center">
                      <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                          © {new Date().getFullYear()}{" "}
                          <a href="/" className="hover:underline">
                              Stocket
                          </a>
                          . All Rights Reserved.
                      </span>
                  </div>
              </div>
          </footer>

    </div>
  )
}

export default Footer