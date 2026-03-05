import { emit } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";

import { Avatar, Button } from "antd";
import { useTranslation } from "react-i18next";
import { useSnapshot } from "valtio";
import ProList from "@/components/ProList";
import ProListItem from "@/components/ProListItem";
import { LISTEN_KEY } from "@/constants";
import { globalStore } from "@/stores/global";

const About = () => {
  const { env } = useSnapshot(globalStore);
  const { t } = useTranslation();

  const handleOpenLicense = () => {
    openUrl("https://github.com/monkey-wenjun/ClipVault/blob/main/LICENSE");
  };

  const handleOpenEcoPaste = () => {
    openUrl("https://github.com/EcoPasteHub/EcoPaste");
  };

  const handleOpenTauri = () => {
    openUrl("https://tauri.app/");
  };

  return (
    <>
      <ProList header={t("preference.about.about_software.title")}>
        <ProListItem
          avatar={<Avatar shape="square" size={44} src="/logo.png" />}
          description={`${t("preference.about.about_software.label.version")}v${env.appVersion}`}
          title={env.appName}
        >
          <Button
            onClick={() => {
              emit(LISTEN_KEY.UPDATE_APP, true);
            }}
            type="primary"
          >
            {t("preference.about.about_software.button.check_update")}
          </Button>
        </ProListItem>
      </ProList>

      <ProList header={t("preference.about.license.title")}>
        <ProListItem
          description={t("preference.about.license.description")}
          title="Apache-2.0"
        >
          <Button onClick={handleOpenLicense} type="link">
            {t("preference.about.license.link")}
          </Button>
        </ProListItem>
      </ProList>

      <ProList header={t("preference.about.acknowledgements.title")}>
        <ProListItem
          description={t("preference.about.acknowledgements.description")}
          title=""
        >
          <div className="flex flex-col gap-2">
            <Button onClick={handleOpenEcoPaste} size="small" type="link">
              {t("preference.about.acknowledgements.ecopaste")}
            </Button>
            <Button onClick={handleOpenTauri} size="small" type="link">
              {t("preference.about.acknowledgements.tauri")}
            </Button>
          </div>
        </ProListItem>
      </ProList>

      <div className="mt-8 text-center text-gray-400 text-sm">
        版权所有 阿文 hi@awen.me
      </div>
    </>
  );
};

export default About;
