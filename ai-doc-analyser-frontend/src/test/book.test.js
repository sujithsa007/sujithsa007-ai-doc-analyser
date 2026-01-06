import React from 'react';
import { shallow } from 'enzyme';
import Booking from '../components/Booking';

describe('Book page', () => {
  let component;

  beforeEach(() => {
    const Games1 = [
      { id: 1, startTime: "9.00 A.M", endTime: "10.00 A.M", slotStatus: "btn btn-success" },
      { id: 2, startTime: "10.00 A.M", endTime: "11.00 A.M", slotStatus: "btn btn-success" },
      { id: 3, startTime: "11.00 A.M", endTime: "12.00 P.M", slotStatus: "btn btn-success" }
    ];
    const selectedGame1 = {
      id: 1,
      name: "Cricket",
      date: new Date().getDate() + 1 + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
      venue: "Stadium A",
      slots: Games1
    };
    const slotBooked1 = undefined;
    component = shallow(
      <Booking
        game={Games1}
        selectedGame={selectedGame1}
      />
    );
  });

  it('Book Content', () => {
    const Date_display = new Date().getDate() + 1 + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear();
    expect(component.find("header").length).toBe(1);
    expect(component.find("header").childAt(0).length).toBe(1);
    expect(component.find("header").find("p").length).toBe(1);
    expect(component.find("header").text()).toBe("Book your slot for Cricket on " + Date_display + " at Stadium A");
  });

  it('input fields', () => {
    expect(component.find("#contact").length).toBe(2);
    component.find("#contact").at(0).simulate("change", { target: { value: "test" } });
    expect(component.state().contact).toEqual("test");
    component.find("#contact").at(1).simulate("change", { target: { value: "test" } });
    expect(component.state().contact).toEqual("test");
  });

  it('err msg: select your slot', () => {
    component.find("#book_button").simulate("Click");
    expect(component.state().errorStmt).toEqual("Select your slot!!!");
    component.find("#contact").at(0).simulate("change", { target: { value: "test" } });
    component.find("#contact").at(1).simulate("change", { target: { value: "test" } });
    component.find("#book_button").simulate("Click");
    expect(component.state().errorStmt).toEqual("Select your slot!!!");
  });

  it('err msg check your field', () => {
    const Games2 = [
      { id: 1, startTime: "9.00 A.M", endTime: "10.00 A.M", slotStatus: "btn btn-success" },
      { id: 2, startTime: "10.00 A.M", endTime: "11.00 A.M", slotStatus: "btn btn-success" },
      { id: 3, startTime: "11.00 A.M", endTime: "12.00 P.M", slotStatus: "btn btn-success" }
    ];
    const selectedGame2 = {
      id: 1,
      name: "Football",
      date: new Date().getDate() + 1 + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
      venue: "Stadium A",
      slots: Games2
    };
    const wrapper = shallow(
      <Booking
        game={Games2}
        selectedGame={selectedGame2}
      />
    );
    wrapper.find("#book_button").simulate("Click");
    expect(wrapper.state().errorStmt).toEqual("Check your field!!!");
  });

  it('Display slot', () => {
    expect(component.find("Connect(Slots)").length).toBe(1);
  });

  it('Booking not opened', () => {
    const Games3 = [
      { id: 1, startTime: "9.00 A.M", endTime: "10.00 A.M", slotStatus: "btn btn-success" },
      { id: 2, startTime: "10.00 A.M", endTime: "11.00 A.M", slotStatus: "btn btn-success" },
      { id: 3, startTime: "11.00 A.M", endTime: "12.00 P.M", slotStatus: "btn btn-success" }
    ];
    const selectedGame3 = {
      id: 1,
      name: "Basketball",
      date: new Date().getDate() + 1 + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
      venue: "Stadium A",
      slots: Games3
    };
    const wrapper = shallow(
      <Booking
        game={Games3}
        selectedGame={selectedGame3}
      />
    );
    expect(wrapper.find("p").at(0).text()).toBe("Booking not opened");
  });

  it('Booking Closed', () => {
    const Games1 = [
      { id: 1, startTime: "9.00 A.M", endTime: "10.00 A.M", slotStatus: "btn btn-success" },
      { id: 2, startTime: "10.00 A.M", endTime: "11.00 A.M", slotStatus: "btn btn-success" },
      { id: 3, startTime: "11.00 A.M", endTime: "12.00 P.M", slotStatus: "btn btn-success" }
    ];
    const Games4 = Games1.map(slot => ({...slot, slotStatus: "btn btn-danger"}));
    const selectedGame4 = {
      id: 1,
      name: "Tennis",
      date: new Date().getDate() + 1 + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(),
      venue: "Stadium A",
      slots: Games4
    };
    const wrapper = shallow(
      <Booking
        game={Games4}
        selectedGame={selectedGame4}
      />
    );
    expect(wrapper.find("p").at(0).text()).toBe("Booking Closed");
  });
});