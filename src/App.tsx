/* eslint-disable jsx-a11y/control-has-associated-label */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Todo } from './types/Todo';
import { createTodo, deleteTodos, getTodos } from './api/todos';
import { TodoRow } from './components/TodoRow';
import { Filter } from './types/Filter';
import { TodoHeader } from './components/TodoHeader';
import { TodoFooter } from './components/TodoFooter';
import { TodoError } from './components/TodoError';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState(Filter.All);
  const [temporaryTodo, setTemporaryTodo] = useState<Todo | null>(null);
  const [processingTodoIds, setProcessingTodoIds] = useState<Array<number>>([]);

  const USER_ID = 11882;

  const loadTodos = async () => {
    try {
      const todosData = await getTodos();

      setTodos(todosData);
    } catch (error) {
      setErrorMessage('Unable to load todos');
    }
  };

  const handleTodoAdd = async (title: string) => {
    setTemporaryTodo({
      id: 0,
      title,
      completed: false,
      userId: USER_ID,
    });

    try {
      const createdTodo = await createTodo(title);

      setTemporaryTodo(null);

      setTodos(prevTodos => [...prevTodos, createdTodo]);
    } catch (error) {
      setTemporaryTodo(null);
      setErrorMessage('Unable to add a todo');

      throw new Error('Some error');
    }
  };

  const handleDelete = async (id: number) => {
    setProcessingTodoIds(prev => [...prev, id]);

    try {
      const isTodoDelete = await deleteTodos(id);

      if (isTodoDelete) {
        setTodos(prev => prev.filter(todo => todo.id !== id));
      } else {
        setErrorMessage('Unable to delete a todo');
      }
    } catch (e) {
      setErrorMessage('Unable to delete a todo');
    } finally {
      setProcessingTodoIds(prev => prev.filter(todoId => todoId !== id));
    }
  };

  const deleteAllCompleted = async () => {
    const allCompleted = todos.filter(t => t.completed);

    await Promise.allSettled(allCompleted.map(todo => (
      handleDelete(todo.id)
    )));
  };

  const filteredTodos = useMemo(() => (
    todos.filter(todo => {
      switch (filter) {
        case Filter.Active:
          return !todo.completed;

        case Filter.Completed:
          return todo.completed;

        case Filter.All:
        default:
          return true;
      }
    })
  ), [filter, todos]);

  const errorTimerId = useRef(0);

  const showErrorMessage = () => {
    if (errorTimerId.current) {
      clearTimeout(errorTimerId.current);
    }

    errorTimerId.current = window.setTimeout(() => {
      setErrorMessage('');
    }, 3000);
  };

  useEffect(() => {
    showErrorMessage();
  }, [errorMessage]);

  useEffect(() => {
    loadTodos();
  }, []);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          todos={todos}
          onError={setErrorMessage}
          onTodoAdd={handleTodoAdd}
        />

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todo => (
            <TodoRow
              todo={todo}
              key={todo.id}
              onTodoDelete={() => handleDelete(todo.id)}
              isLoading={processingTodoIds.includes(todo.id)}
            />
          ))}
          {temporaryTodo && (
            <TodoRow
              todo={temporaryTodo}
              isLoading
            />
          )}
        </section>

        {todos.length > 0
          && (
            <TodoFooter
              todos={todos}
              filter={filter}
              setFilter={setFilter}
              deleteAllCompleted={deleteAllCompleted}
            />
          )}
      </div>

      <TodoError
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};
