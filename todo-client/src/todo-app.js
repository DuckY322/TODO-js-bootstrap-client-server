let myTodos = [];

function createAppLinks(mainContainer, links) {
    const container = document.createElement(`div`);
    container.classList.add(`container`, `mb-5`);

    const nav = document.createElement(`nav`);
    nav.classList.add(`nav`);

    links.forEach(item => {
        const link = document.createElement(`a`);
        link.classList.add(`nav-link`);
        link.textContent = item.title;
        link.style.cursor = 'pointer';
        link.addEventListener(`click`, function () {
            mainContainer.innerHTML = ""
            createTodoApp(mainContainer, item.title, item.owner)
        });

        nav.append(link);
    });

    container.append(nav);

    return container
}

function createAppTitle(title) {
    const appTile = document.createElement(`h2`);
    appTile.innerHTML = title;
    return appTile;
};

function createTodoItemForm() {
    const form = document.createElement(`form`);
    const input = document.createElement(`input`);
    const buttonWrapper = document.createElement(`div`);
    const button = document.createElement(`button`);

    form.classList.add(`input-group`, `mb-3`);
    input.classList.add(`form-control`);
    input.placeholder = `Введите название нового дела`;
    buttonWrapper.classList.add(`input-group-append`);
    button.setAttribute(`disabled`, `disabled`);
    button.classList.add(`btn`, `btn-primary`);
    button.textContent = `Добавить дело`;

    buttonWrapper.append(button);
    form.append(input);
    form.append(buttonWrapper);

    return {
        form,
        input,
        button,
    };
};

function createTodoList() {
    const list = document.createElement(`ul`);
    list.classList.add(`list-group`);
    return list;
};

function createTodoItemElement(todoItem, { onDone, onDelete }) {
    const doneClass = `list-group-item-success`;

    const item = document.createElement(`li`);

    const buttonGroup = document.createElement(`div`);
    const doneButton = document.createElement(`button`);
    const deleteButton = document.createElement(`button`);

    item.classList.add(`list-group-item`, `d-flex`, `justify-content-between`, `align-items-center`);
    item.textContent = todoItem.name;
    if (todoItem.done) {
        item.classList.add(doneClass);
    }

    doneButton.addEventListener(`click`, function () {
        onDone({ todoItem, element: item, doneClass: doneClass });
    });

    deleteButton.addEventListener(`click`, function () {
        onDelete({ todoItem, element: item });
    });

    buttonGroup.classList.add(`btn-group`, `btn-group-sm`);
    doneButton.classList.add(`btn`, `btn-success`);
    doneButton.textContent = `Готово`;
    deleteButton.classList.add(`btn`, `btn-danger`);
    deleteButton.textContent = `Удалить`;

    buttonGroup.append(doneButton);
    buttonGroup.append(deleteButton);
    item.append(buttonGroup);

    return item;
};

async function createTodoApp(container, title = `Мои дела`, owner = `Me`) {
    const todoAppLinks = createAppLinks(container, [
        {
            title: `Мои дела`,
            owner: `Me`,
        },
        {
            title: `Дела мамы`,
            owner: `Mom`,
        },
        {
            title: `Дела папы`,
            owner: `Dad`,
        },
    ]);
    const todoAppTitle = createAppTitle(title);
    const todoItemForm = createTodoItemForm();
    const todoList = createTodoList();

    const handlers = {
        onDone({ todoItem, element, doneClass }) {
            todoItem.done = !todoItem.done;
            element.classList.toggle(doneClass, todoItem.done);

            communicateToServer(`/${todoItem.id}`, `PATCH`, { done: todoItem.done });
        },
        onDelete({ todoItem, element }) {
            if (confirm(`Вы уверены?`)) {
                element.remove();

                communicateToServer(`/${todoItem.id}`, `DELETE`);
            }
        }
    };

    container.append(todoAppLinks);
    container.append(todoAppTitle);
    container.append(todoItemForm.form);
    container.append(todoList);

    myTodos = await communicateToServer(`?owner=${owner}`);

    myTodos.forEach(todoItem => {
        const todoItemElement = createTodoItemElement(todoItem, handlers);
        todoList.append(todoItemElement);
    });

    todoItemForm.form.addEventListener(`submit`, async e => {
        e.preventDefault();

        if (!todoItemForm.input.value) {
            return;
        }

        const todoItem = await communicateToServer(``, `POST`, { owner: owner, name: todoItemForm.input.value.trim(), done: false });

        const todoItemElement = createTodoItemElement(todoItem, handlers);
        todoList.append(todoItemElement);

        todoItemForm.input.value = ``;
        disabledFormButton(todoItemForm.input.value, todoItemForm.button);
    });

    todoItemForm.input.oninput = function () {
        disabledFormButton(todoItemForm.input.value, todoItemForm.button);
    }

}

function disabledFormButton(value, button) {
    if (value) {
        button.removeAttribute(`disabled`);
    } else {
        button.setAttribute(`disabled`, `disabled`);
    };
}

async function communicateToServer(query = ``, method = `GET`, body, headers = { 'Content-Type': 'application/json' }) {
    const response = await fetch(`http://localhost:3000/api/todos${query}`, {
        method: method,
        body: JSON.stringify(body),
        headers: headers
    })

    return response.json();
}

document.addEventListener(`DOMContentLoaded`, function () {
    createTodoApp(document.getElementById(`todo-app`));
});