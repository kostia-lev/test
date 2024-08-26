import styled from "styled-components"
import { SmallText, BodyText } from "@ikiru/talentis-fpc"

export const GoogleSearchItemWrapper = styled.div`
  position: relative;
  border: 3px solid ${({ theme }) => theme.colors.grey.lightest};
`

export const ResultBox = styled.div`
  padding: ${({ theme }) => theme.space.xs}px;
`

export const ConnectedIconWrapper = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space.xs}px;
  right: ${({ theme }) => theme.space.xs}px;
`

export const ProfileDetailsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.grey.lightest};
  padding: ${({ theme }) => theme.space.xs}px ${({ theme }) => theme.space.xs}px;
  width: 100%;
`

export const ProfileDetails = styled.div`
  display: grid;
  grid-template-columns: max-content auto;
  grid-gap: ${({ theme }) => theme.space.xs}px;
  box-sizing: border-box;
  padding-left: ${({ theme }) => theme.space.s}px;
`

export const Label = styled(SmallText)`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 0;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.grey.darkest};
`

export const PersonDetailedValue = styled(BodyText)`
  line-height: 19px;
  font-size: 15px;
  margin: 0;
`
