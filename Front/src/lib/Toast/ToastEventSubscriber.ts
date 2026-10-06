import {eventBus} from '../EventBus/EventBus';
import {AdminCreationFailedEvent} from '../User/CreateAdmin/Event/AdminCreationFailedEvent';
import {AttachmentSaveFailedEvent} from '../Attachment/Event/AttachmentSaveFailedEvent';
import {AttachmentWasSavedEvent} from '../Attachment/Event/AttachmentWasSavedEvent';
import {AdminWasCreatedEvent} from '../User/CreateAdmin/Event/AdminWasCreatedEvent';
import {BoardSaveFailedEvent} from '../Board/Event/BoardSaveFailedEvent';
import {BoardWasSavedEvent} from '../Board/Event/BoardWasSavedEvent';
import {LoginFailedEvent} from '../User/Login/Event/LoginFailedEvent';
import {ProjectSaveFailedEvent} from '../Project/Event/ProjectSaveFailedEvent';
import {ProjectWasSavedEvent} from '../Project/Event/ProjectWasSavedEvent';
import {ReleaseSaveFailedEvent} from '../Release/Event/ReleaseSaveFailedEvent';
import {ReleaseWasSavedEvent} from '../Release/Event/ReleaseWasSavedEvent';
import {RoleDeleteFailedEvent} from '../Role/Event/RoleDeleteFailedEvent';
import {RoleSaveFailedEvent} from '../Role/Event/RoleSaveFailedEvent';
import {RoleWasDeletedEvent} from '../Role/Event/RoleWasDeletedEvent';
import {RoleWasSavedEvent} from '../Role/Event/RoleWasSavedEvent';
import {SprintActionFailedEvent} from '../Sprint/Event/SprintActionFailedEvent';
import {SprintSaveFailedEvent} from '../Sprint/Event/SprintSaveFailedEvent';
import {SprintWasClosedEvent} from '../Sprint/Event/SprintWasClosedEvent';
import {SprintWasSavedEvent} from '../Sprint/Event/SprintWasSavedEvent';
import {SprintWasStartedEvent} from '../Sprint/Event/SprintWasStartedEvent';
import {TicketSaveFailedEvent} from '../Ticket/Event/TicketSaveFailedEvent';
import {TicketWasSavedEvent} from '../Ticket/Event/TicketWasSavedEvent';
import {UserAvatarUploadFailedEvent} from '../User/Event/UserAvatarUploadFailedEvent';
import {UserAvatarWasUploadedEvent} from '../User/Event/UserAvatarWasUploadedEvent';
import {UserCreationFailedEvent} from '../User/Event/UserCreationFailedEvent';
import {UserRolesAssignFailedEvent} from '../User/Event/UserRolesAssignFailedEvent';
import {UserRolesWereAssignedEvent} from '../User/Event/UserRolesWereAssignedEvent';
import {UserUpdateFailedEvent} from '../User/Event/UserUpdateFailedEvent';
import {UserWasCreatedEvent} from '../User/Event/UserWasCreatedEvent';
import {UserWasUpdatedEvent} from '../User/Event/UserWasUpdatedEvent';
import {UserPasswordWasChangedEvent} from '../User/Event/UserPasswordWasChangedEvent';
import {UserPasswordChangeFailedEvent} from '../User/Event/UserPasswordChangeFailedEvent';
import {toastService} from './ToastService';

export const registerToastEventSubscribers = (): void => {
    eventBus.subscribe<AdminWasCreatedEvent>(AdminWasCreatedEvent.name, (event) => {
        toastService.push('success', `Administrator ${event.email} został utworzony`);
    });

    eventBus.subscribe<AdminCreationFailedEvent>(AdminCreationFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<BoardSaveFailedEvent>(BoardSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<BoardWasSavedEvent>(BoardWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<SprintSaveFailedEvent>(SprintSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<SprintWasSavedEvent>(SprintWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<SprintActionFailedEvent>(SprintActionFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<SprintWasStartedEvent>(SprintWasStartedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<SprintWasClosedEvent>(SprintWasClosedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<LoginFailedEvent>(LoginFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<ProjectSaveFailedEvent>(ProjectSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<ProjectWasSavedEvent>(ProjectWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<ReleaseSaveFailedEvent>(ReleaseSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<ReleaseWasSavedEvent>(ReleaseWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<TicketSaveFailedEvent>(TicketSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<TicketWasSavedEvent>(TicketWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<AttachmentSaveFailedEvent>(AttachmentSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<AttachmentWasSavedEvent>(AttachmentWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<UserWasCreatedEvent>(UserWasCreatedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<UserCreationFailedEvent>(UserCreationFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<UserRolesWereAssignedEvent>(UserRolesWereAssignedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<UserRolesAssignFailedEvent>(UserRolesAssignFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<RoleWasSavedEvent>(RoleWasSavedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<RoleSaveFailedEvent>(RoleSaveFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<RoleWasDeletedEvent>(RoleWasDeletedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<RoleDeleteFailedEvent>(RoleDeleteFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<UserWasUpdatedEvent>(UserWasUpdatedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<UserUpdateFailedEvent>(UserUpdateFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<UserAvatarWasUploadedEvent>(UserAvatarWasUploadedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<UserAvatarUploadFailedEvent>(UserAvatarUploadFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });

    eventBus.subscribe<UserPasswordWasChangedEvent>(UserPasswordWasChangedEvent.name, (event) => {
        toastService.push('success', event.message);
    });

    eventBus.subscribe<UserPasswordChangeFailedEvent>(UserPasswordChangeFailedEvent.name, (event) => {
        toastService.push('error', event.message);
    });
}
