import React, { useState, useEffect, useCallback, useRef } from "react"
import { get } from "lodash"
import {
  Flex,
  Div,
  Tag,
  H6,
  SmallText,
  ConnectedIcon,
  Avatar
} from "@ikiru/talentis-fpc"
import {
  ChromeMessageTypes,
  ChromePortMessageType
} from "utils/chrome-messages"
import { messages } from "setup/messages/messages"
import { useSearchEnhanced } from "content/google-search/consts/hooks"
import {
  RetrievedUserMsg,
  SearchProfile,
  xpaths
} from "content/google-search/consts/definitions"
import { getFullDetailsLink } from "utils/links"
import { ChromeConnectionType } from "utils/chrome-connections"
import { InterviewProgressStage } from "popup/components/PersonProfile/components/PersonCandidates/interview-progress/constants/interview-progress-stages"
import { InterviewProgressStatus } from "popup/components/PersonProfile/components/PersonCandidates/interview-progress/constants/interview-progress-statuses"
import {
  GoogleSearchItemWrapper,
  ConnectedIconWrapper,
  ResultBox,
  ProfileDetails,
  ProfileDetailsWrapper,
  Label,
  PersonDetailedValue
} from "./styles"
import { Links } from "./components/Links"
import {
  checkIfLinkedin,
  getSingleNodeByXPath
} from "content/google-search/consts/utils"
import { formatDate } from "utils/format-date"
import { prepareProfileData } from "./utils"
import { wrapWithTryCatch } from "content/content.utils"

type GoogleSearchItemProps = {
  identifier: string
  children: HTMLElement
}

let port = chrome.runtime.connect({ name: ChromeConnectionType.GoogleSearch })
const wrapWithTryCatchGenerated = wrapWithTryCatch(
  () =>
    (port = chrome.runtime.connect({ name: ChromeConnectionType.GoogleSearch }))
)

export const GoogleSearchItem = React.memo(
  ({ children, identifier }: GoogleSearchItemProps) => {
    const [profile, setProfile] = useState<SearchProfile>()
    const { isLoggedIn, isSearchEnhanced } = useSearchEnhanced()
    const isPersonRequested = useRef(false)

    const isProfileExists = profile?.personId || profile?.dataPoolId

    const handleMessageFromBackground = useCallback(
      (msg: RetrievedUserMsg) => {
        const {
          type,
          profileData,
          identifier: comingIdentifier,
          localPerson
        } = msg

        if (identifier !== comingIdentifier) {
          return
        }

        switch (type) {
          case ChromePortMessageType.SetUser:
            setProfile(prepareProfileData(profileData))
            break
          case ChromePortMessageType.UpdateUser:
            setProfile((state) =>
              prepareProfileData({ ...state, ...profileData })
            )
            break
          case ChromePortMessageType.ReceiveLocalPerson:
            if (localPerson?.id) {
              const personId = localPerson?.id
              setProfile((state) => ({ ...state, personId }))
              const externalLink = getFullDetailsLink(personId)
              window.open(externalLink, "_blank")
            }
        }
      },
      [identifier]
    )

    useEffect(() => {
      wrapWithTryCatchGenerated(() =>
        port.onMessage.addListener(handleMessageFromBackground)
      )

      return () => port.onMessage.removeListener(handleMessageFromBackground)
    }, [handleMessageFromBackground])

    useEffect(() => {
      if (isLoggedIn && !isPersonRequested.current) {
        const title = getSingleNodeByXPath(xpaths.title, children)?.textContent
        const snippet = getSingleNodeByXPath(
          xpaths.snippet,
          children
        )?.textContent
        const metadata = getSingleNodeByXPath(
          xpaths.metadata,
          children
        )?.textContent

        !title &&
          console.warn(`Scrapping person - Title is missing (${identifier})`)
        !snippet &&
          console.warn(`Scrapping person - Snippet is missing (${identifier})`)

        const data = {
          type: ChromeMessageTypes.FetchProfile,
          identifier,
          title,
          snippet,
          metadata
        }

        wrapWithTryCatchGenerated(() => port.postMessage(data))
        isPersonRequested.current = true
      }
    }, [isLoggedIn, identifier, children])

    const onTalentisIconClick = useCallback(() => {
      if (profile?.dataPoolId && !profile?.personId) {
        wrapWithTryCatchGenerated(() =>
          port.postMessage({
            type: ChromeMessageTypes.LinkageDatapoolPerson,
            dataPoolId: profile.dataPoolId,
            identifier
          })
        )
      }
    }, [profile, profile?.dataPoolId, profile?.personId, identifier])

    if (!isSearchEnhanced || !isLoggedIn || !isProfileExists) {
      return <div ref={(ref) => ref?.append(children)}></div>
    }

    const profileUrl = profile?.personId
      ? getFullDetailsLink(profile?.personId)
      : undefined

    const recentAssignmentStage =
      profile?.recentAssignment?.stage || InterviewProgressStage.Identified
    const recentAssignmentStatus =
      profile?.recentAssignment?.status || InterviewProgressStatus.NoStatus

    const isIdentifierIsLinkedInUrl = checkIfLinkedin(identifier)
    const isWebsites = profile?.websites?.length || isIdentifierIsLinkedInUrl
    const isProfileDetails =
      profile?.jobTitle ||
      profile?.companyName ||
      (profile?.location && profile?.location.trim() !== "") ||
      profile?.currentSectors?.length ||
      profile?.recentAssignment ||
      profile?.recentNote ||
      isWebsites

    const containsLinkedInProfileUrl =
      (profile?.websites || []).findIndex(
        (p) => p.websiteType === "linkedIn"
      ) >= 0

    return (
      <GoogleSearchItemWrapper>
        {profile?.personId && (
          <ConnectedIconWrapper>
            <ConnectedIcon height={15} />
          </ConnectedIconWrapper>
        )}
        <ResultBox ref={(ref) => ref?.append(children)}></ResultBox>
        {Boolean(isProfileDetails) && (
          <ProfileDetailsWrapper>
            <Div minWidth={50} width={50} height={50}>
              <Avatar
                width={50}
                height={50}
                name={profile?.name}
                photo={profile?.photo}
              />
            </Div>
            <ProfileDetails>
              {(profile?.jobTitle || profile?.companyName) && (
                <>
                  <Label>{messages.searchPage.profile?.currentRole}</Label>
                  <Flex alignItems="center">
                    <PersonDetailedValue>
                      {profile?.jobTitle && profile?.companyName
                        ? messages.searchPage.profile?.currentRoleValue.format(
                            profile?.jobTitle,
                            profile?.companyName
                          )
                        : profile?.companyName || profile?.jobTitle}
                    </PersonDetailedValue>
                  </Flex>
                </>
              )}
              {profile?.location && profile?.location.trim() !== "" && (
                <>
                  <Label>{messages.searchPage.profile?.location}</Label>
                  <Flex alignItems="center">
                    <PersonDetailedValue>
                      {profile?.location}
                    </PersonDetailedValue>
                  </Flex>
                </>
              )}
              {Boolean(profile?.currentSectors?.length) && (
                <>
                  <Label>{messages.searchPage.profile?.sector}</Label>
                  <Flex alignItems="center">
                    <PersonDetailedValue>
                      {profile?.currentSectors?.join(", ")}
                    </PersonDetailedValue>
                  </Flex>
                </>
              )}
              {profile?.recentAssignment && (
                <>
                  <Label>{messages.searchPage.profile?.assignment}</Label>
                  <Flex alignItems="center">
                    <Tag mb="none" variant="grey-dark" disabled>
                      <H6 color="white.standard" my="none">
                        {profile?.recentAssignment?.name}
                      </H6>
                    </Tag>
                    <Tag mb="none" variant="white" disabled>
                      <H6 fontWeight="bold" color="grey.dark" my="none">
                        {get(
                          messages.person.assignments.interviewProgress.stages,
                          recentAssignmentStage.firstCharToLowerCase(),
                          recentAssignmentStage
                        )}
                      </H6>
                    </Tag>
                    <Tag mb="none" variant="white" disabled>
                      <H6 fontWeight="bold" color="grey.dark" my="none">
                        {get(
                          messages.person.assignments.interviewProgress
                            .statuses,
                          recentAssignmentStatus.firstCharToLowerCase(),
                          recentAssignmentStatus
                        )}
                      </H6>
                    </Tag>
                  </Flex>
                </>
              )}
              {profile?.recentNote && (
                <>
                  <Label>{messages.searchPage.profile?.recentNote}</Label>
                  <Flex alignItems="center">
                    <PersonDetailedValue>
                      {profile?.recentNote.noteTitle}
                    </PersonDetailedValue>
                    <SmallText ml="xs" my={0}>
                      {formatDate(profile?.recentNote.createdOrUpdated)}{" "}
                      {profile?.recentNote.byFirstName || ""}{" "}
                      {profile?.recentNote.byLastName || ""}
                    </SmallText>
                  </Flex>
                </>
              )}
              <Label>{messages.searchPage.profile?.links}</Label>
              <Links
                onTalentisIconClick={onTalentisIconClick}
                talentisProfileUrl={profileUrl}
                linkedInProfileUrl={
                  profile?.linkedInProfileUrl ||
                  (isIdentifierIsLinkedInUrl && !containsLinkedInProfileUrl
                    ? identifier
                    : "")
                }
                websites={profile?.websites || []}
              />
            </ProfileDetails>
          </ProfileDetailsWrapper>
        )}
      </GoogleSearchItemWrapper>
    )
  }
)
